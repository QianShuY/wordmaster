package io.wordmaster.g0prototype;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.net.Uri;
import android.speech.tts.TextToSpeech;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.*;
import com.getcapacitor.annotation.*;
import org.json.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.*;

/** Offline storage boundary. Packaged shared JS owns learning rules; this class
 * provides serialized, revision-checked, idempotent SQLite transactions. */
@CapacitorPlugin(name="MobileStore")
public class MobileStorePlugin extends Plugin {
    private final ExecutorService worker=Executors.newSingleThreadExecutor();
    private SQLiteDatabase database;
    private TextToSpeech speech;
    private boolean speechReady;
    private static final Set<String> TABLES=new HashSet<>(Arrays.asList("wordbooks","words","progress","review_log","mobile_sessions","mobile_settings","cards","user_cards","card_draws"));
    private static final Pattern WRITE=Pattern.compile("(?is)^(?:INSERT(?: OR (?:IGNORE|REPLACE))? INTO|UPDATE|DELETE FROM)\\s+([a-z_]+)\\b.*");

    @PluginMethod public void query(PluginCall call){run(call,()->{
        SQLiteDatabase db=db();String sql=call.getString("sql","").trim();
        if(!sql.toUpperCase(Locale.ROOT).startsWith("SELECT ")||sql.contains(";")||sql.length()>100000)throw new IllegalArgumentException("不支持的读取请求");
        JSObject out=new JSObject();out.put("rows",rows(db,sql,args(call.getData().optJSONArray("args"))));out.put("revision",revision(db));call.resolve(out);
    });}

    @PluginMethod public void commit(PluginCall call){run(call,()->{
        SQLiteDatabase db=db();JSObject data=call.getData();String id=data.optString("requestId"),digest=sha(data.toString().getBytes(StandardCharsets.UTF_8));
        if(!id.matches("[A-Za-z0-9_-]{8,128}"))throw new IllegalArgumentException("无效请求编号");
        try(Cursor c=db.rawQuery("SELECT payload_sha256,response_json FROM native_requests WHERE request_id=?",new String[]{id})){
            if(c.moveToFirst()){if(!digest.equals(c.getString(0)))throw new IllegalArgumentException("请求编号已用于不同内容");call.resolve(JSObject.fromJSONObject(new JSONObject(c.getString(1))));return;}
        }
        if(data.optInt("expectedRevision",-1)!=revision(db))throw new IllegalStateException("数据已更新，请重新打开当前任务后继续。");
        JSONArray statements=data.getJSONArray("statements");if(statements.length()>150000)throw new IllegalArgumentException("导入内容过大");
        if(data.optBoolean("backup"))backupBeforeImport(db);
        JSObject out;
        db.beginTransaction();
        try{
            for(int i=0;i<statements.length();i++){
                JSONObject statement=statements.getJSONObject(i);String sql=statement.getString("sql").trim();Matcher m=WRITE.matcher(sql);
                if(!m.matches()||!TABLES.contains(m.group(1).toLowerCase(Locale.ROOT))||sql.contains(";"))throw new IllegalArgumentException("不支持的写入请求");
                db.execSQL(sql,objects(statement.optJSONArray("args")));
            }
            db.execSQL("UPDATE native_meta SET value=CAST(value AS INTEGER)+1 WHERE key='revision'");
            out=new JSObject();out.put("revision",revision(db));out.put("ok",true);
            db.execSQL("INSERT INTO native_requests VALUES(?,?,?)",new Object[]{id,digest,out.toString()});
            db.setTransactionSuccessful();
        }finally{db.endTransaction();}
        call.resolve(out);
    });}

    @PluginMethod public void saveFile(PluginCall call){
        String text=call.getString("text","");if(text.length()>64*1024*1024){call.reject("备份文件过大");return;}
        Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT);intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType("application/json");intent.putExtra(Intent.EXTRA_TITLE,call.getString("name","墨词-备份.json"));startActivityForResult(call,intent,"savedFile");
    }
    @ActivityCallback private void savedFile(PluginCall call,ActivityResult result){
        if(call==null)return;if(result.getResultCode()!=Activity.RESULT_OK||result.getData()==null){call.resolve(new JSObject().put("cancelled",true));return;}
        Uri uri=result.getData().getData();run(call,()->{try(OutputStream out=getContext().getContentResolver().openOutputStream(uri,"wt")){if(out==null)throw new IOException("无法写入文件");out.write(call.getString("text","").getBytes(StandardCharsets.UTF_8));}call.resolve(new JSObject().put("saved",true));});
    }
    @PluginMethod public void openFile(PluginCall call){Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT);intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType("*/*");startActivityForResult(call,intent,"openedFile");}
    @ActivityCallback private void openedFile(PluginCall call,ActivityResult result){
        if(call==null)return;if(result.getResultCode()!=Activity.RESULT_OK||result.getData()==null){call.resolve(new JSObject().put("cancelled",true));return;}
        run(call,()->{try(InputStream in=getContext().getContentResolver().openInputStream(result.getData().getData())){if(in==null)throw new IOException("无法读取文件");byte[] bytes=read(in,64*1024*1024);call.resolve(new JSObject().put("text",new String(bytes,StandardCharsets.UTF_8)));}});
    }
    @PluginMethod public void speak(PluginCall call){getActivity().runOnUiThread(()->{
        String text=call.getString("text","");if(text.length()>150){call.reject("朗读文本过长");return;}
        if(speech==null){speech=new TextToSpeech(getContext(),status->{
            speechReady=false;
            if(status==TextToSpeech.SUCCESS){
                android.speech.tts.Voice selected=null;Set<android.speech.tts.Voice> voices=speech.getVoices();
                if(voices!=null)for(android.speech.tts.Voice voice:voices){
                    if("en".equals(voice.getLocale().getLanguage())&&!voice.isNetworkConnectionRequired()){
                        selected=voice;if("GB".equals(voice.getLocale().getCountry()))break;
                    }
                }
                speechReady=selected!=null&&speech.setVoice(selected)==TextToSpeech.SUCCESS;
            }
            if(speechReady){speech.setSpeechRate(.85f);int result=speech.speak(text,TextToSpeech.QUEUE_FLUSH,null,"moci-word");if(result==TextToSpeech.ERROR)call.reject("朗读未能开始，请重试");else call.resolve();}
            else call.reject("未找到英语离线语音，请在系统设置中安装英语离线语音包。");
        });}
        else if(speechReady){if(speech.speak(text,TextToSpeech.QUEUE_FLUSH,null,"moci-word")==TextToSpeech.ERROR)call.reject("朗读未能开始，请重试");else call.resolve();}else call.reject("英语语音尚未就绪，可稍后再试。");
    });}
    @PluginMethod public void exit(PluginCall call){getActivity().runOnUiThread(()->{call.resolve();getActivity().finish();});}
    @Override protected void handleOnPause(){if(speech!=null)speech.stop();}

    private synchronized SQLiteDatabase db() throws Exception {
        if(database!=null)return database;
        File target=getContext().getDatabasePath("wordmaster-mobile.db");File parent=target.getParentFile();if(!parent.exists()&&!parent.mkdirs())throw new IOException("无法创建数据库目录");
        if(!target.exists()){
            JSONObject manifest;try(InputStream in=getContext().getAssets().open("mobile-seed-manifest.json")){manifest=new JSONObject(new String(read(in,100000),StandardCharsets.UTF_8));}
            File temp=new File(parent,"wordmaster-mobile.db.installing");
            try(InputStream in=getContext().getAssets().open("mobile-seed.db");FileOutputStream out=new FileOutputStream(temp)){byte[] b=new byte[65536];int n;while((n=in.read(b))!=-1)out.write(b,0,n);out.getFD().sync();}
            try(InputStream in=new FileInputStream(temp)){if(!sha(read(in,64*1024*1024)).equals(manifest.getString("sha256")))throw new IOException("内置词库校验失败");}
            SQLiteDatabase check=SQLiteDatabase.openDatabase(temp.getPath(),null,SQLiteDatabase.OPEN_READONLY);
            try{if(rows(check,"SELECT COUNT(*) n FROM words",new String[0]).getJSONObject(0).getInt("n")!=manifest.getInt("words")||rows(check,"SELECT COUNT(*) n FROM progress",new String[0]).getJSONObject(0).getInt("n")!=0)throw new IOException("种子库隐私或计数校验失败");}finally{check.close();}
            if(!temp.renameTo(target))throw new IOException("内置词库安装未完成");
        }
        SQLiteDatabase db=SQLiteDatabase.openDatabase(target.getPath(),null,SQLiteDatabase.OPEN_READWRITE);db.setForeignKeyConstraintsEnabled(true);
        if(!"1".equals(value(db,"PRAGMA user_version"))){db.close();throw new IOException("不支持此版本的手机数据库，请先导出备份");}
        try{migrateLegacy(db);database=db;return db;}catch(Exception error){db.close();throw error;}
    }

    private void migrateLegacy(SQLiteDatabase db) throws Exception {
        if("1".equals(value(db,"SELECT value FROM native_meta WHERE key='legacy_imported'")))return;
        File old=getContext().getDatabasePath("wordmaster.db");
        if(!old.exists()){db.execSQL("INSERT INTO native_meta VALUES('legacy_imported','1')");return;}
        // The old file is never written. All conversion is atomic in the new DB.
        db.execSQL("ATTACH DATABASE ? AS legacy",new Object[]{old.getPath()});
        db.beginTransaction();
        try{
            db.execSQL("INSERT OR IGNORE INTO wordbooks(book_key,name,description,is_builtin,daily_new,target_date,plan_active,archived,sort_order) SELECT book_key,name,description,is_builtin,daily_new,target_date,plan_active,CASE WHEN book_key='builtin:zhongkao' THEN 1 ELSE 0 END,sort_order FROM legacy.wordbooks");
            db.execSQL("UPDATE wordbooks SET daily_new=(SELECT daily_new FROM legacy.wordbooks l WHERE l.book_key=wordbooks.book_key),target_date=(SELECT target_date FROM legacy.wordbooks l WHERE l.book_key=wordbooks.book_key),plan_active=(SELECT plan_active FROM legacy.wordbooks l WHERE l.book_key=wordbooks.book_key) WHERE book_key IN(SELECT book_key FROM legacy.wordbooks)");
            try(Cursor c=db.rawQuery("SELECT word_key,book_key,word,phonetic,pos,meaning,example FROM legacy.words",null)){
                while(c.moveToNext()){
                    String key=c.getString(0),fingerprint=sha((c.getString(2)+"\0"+c.getString(3)+"\0"+c.getString(4)+"\0"+c.getString(5)+"\0"+c.getString(6)).getBytes(StandardCharsets.UTF_8));
                    String expected=value(db,"SELECT legacy_sha256 FROM words WHERE word_key=?",key);
                    if(value(db,"SELECT word_key FROM words WHERE word_key=?",key)!=null){if(!fingerprint.equals(expected)){
                        String currentBook=value(db,"SELECT book_key FROM words WHERE word_key=?",key);
                        if(value(db,"SELECT word_key FROM words WHERE book_key=? AND word=? AND word_key<>?",currentBook,c.getString(2),key)!=null){
                            String history="history:edited:"+key;
                            db.execSQL("INSERT OR IGNORE INTO wordbooks(book_key,name,description,archived) SELECT ?,name||' · 自改条目','保留旧版编辑内容及其学习记录',1 FROM wordbooks WHERE book_key=?",new Object[]{history,currentBook});
                            db.execSQL("UPDATE words SET book_key=? WHERE word_key=?",new Object[]{history,key});
                        }
                        db.execSQL("UPDATE words SET word=?,headword=NULL,homograph=NULL,phonetic=?,pos=?,meaning=?,example=?,example_translation='',policy_json='',edited=1 WHERE word_key=?",new Object[]{c.getString(2),c.getString(3),c.getString(4),c.getString(5),c.getString(6),key});
                    }}
                    else {
                        String bookKey=c.getString(1);
                        if(value(db,"SELECT word_key FROM words WHERE book_key=? AND word=?",bookKey,c.getString(2))!=null){String history="history:"+bookKey;db.execSQL("INSERT OR IGNORE INTO wordbooks(book_key,name,description,archived) SELECT ?,name||' · 旧条目','保留旧版独立词条与学习记录',1 FROM wordbooks WHERE book_key=?",new Object[]{history,bookKey});bookKey=history;}
                        db.execSQL("INSERT INTO words(word_key,book_key,word,phonetic,pos,meaning,example,retired) VALUES(?,?,?,?,?,?,?,?)",new Object[]{key,bookKey,c.getString(2),c.getString(3),c.getString(4),c.getString(5),c.getString(6),c.getString(1).startsWith("builtin:")?1:0});
                    }
                }
            }
            db.execSQL("INSERT INTO progress(word_key,correct,wrong,streak,last_review,next_due,first_studied) SELECT word_key,correct,wrong,streak,last_review,next_due,first_studied FROM legacy.progress");
            db.execSQL("INSERT INTO review_log(event_id,word_key,correct,is_new,ts,local_day,timezone_id,mode,outcome,session_id,payload) SELECT 'legacy:'||id,word_key,correct,is_new,ts,substr(ts,1,10),'legacy-unknown','legacy',outcome,session_id,request_payload FROM legacy.review_log");
            db.execSQL("INSERT OR IGNORE INTO user_cards SELECT u.card_id,u.earned_at FROM legacy.user_cards u JOIN cards c ON c.id=u.card_id");
            db.execSQL("INSERT OR IGNORE INTO card_draws SELECT d.day,d.card_id,d.created_at FROM legacy.card_draws d WHERE d.card_id IS NULL OR d.card_id IN(SELECT id FROM cards)");
            db.execSQL("INSERT INTO native_meta VALUES('legacy_imported','1')");db.setTransactionSuccessful();
        }finally{db.endTransaction();db.execSQL("DETACH DATABASE legacy");}
    }

    private void backupBeforeImport(SQLiteDatabase db) throws Exception {
        File dir=new File(getContext().getFilesDir(),"import-backups");if(!dir.exists()&&!dir.mkdirs())throw new IOException("无法保存导入前备份");
        File source=getContext().getDatabasePath("wordmaster-mobile.db"),target=new File(dir,"before-import-"+System.currentTimeMillis()+".db");
        try(InputStream in=new FileInputStream(source);FileOutputStream out=new FileOutputStream(target)){byte[] b=new byte[65536];int n;while((n=in.read(b))!=-1)out.write(b,0,n);out.getFD().sync();}
    }
    private static JSONArray rows(SQLiteDatabase db,String sql,String[] args) throws Exception {
        JSONArray rows=new JSONArray();try(Cursor c=db.rawQuery(sql,args)){while(c.moveToNext()){if(rows.length()>=4000)throw new IllegalArgumentException("请分页读取词库");JSONObject row=new JSONObject();for(int i=0;i<c.getColumnCount();i++){Object v=c.isNull(i)?JSONObject.NULL:c.getType(i)==Cursor.FIELD_TYPE_INTEGER?c.getLong(i):c.getType(i)==Cursor.FIELD_TYPE_FLOAT?c.getDouble(i):c.getString(i);row.put(c.getColumnName(i),v);}rows.put(row);}}return rows;
    }
    private static String value(SQLiteDatabase db,String sql,String... args){try(Cursor c=db.rawQuery(sql,args)){return c.moveToFirst()&&!c.isNull(0)?c.getString(0):null;}}
    private static int revision(SQLiteDatabase db){return Integer.parseInt(value(db,"SELECT value FROM native_meta WHERE key='revision'"));}
    private static Object[] objects(JSONArray a)throws Exception{if(a==null)return new Object[0];Object[] out=new Object[a.length()];for(int i=0;i<a.length();i++)out[i]=a.isNull(i)?null:a.get(i);return out;}
    private static String[] args(JSONArray a)throws Exception{if(a==null)return new String[0];String[] out=new String[a.length()];for(int i=0;i<a.length();i++)out[i]=a.isNull(i)?null:a.get(i).toString();return out;}
    private static byte[] read(InputStream in,int max)throws IOException{ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] b=new byte[65536];int n;while((n=in.read(b))!=-1){if(out.size()+n>max)throw new IOException("文件过大");out.write(b,0,n);}return out.toByteArray();}
    private static String sha(byte[] bytes)throws Exception{byte[] hash=MessageDigest.getInstance("SHA-256").digest(bytes);StringBuilder out=new StringBuilder();for(byte b:hash)out.append(String.format(Locale.ROOT,"%02x",b));return out.toString();}
    private interface Operation{void run()throws Exception;}
    private void run(PluginCall call,Operation operation){worker.execute(()->{try{operation.run();}catch(Exception error){call.reject(error.getMessage()==null?"本地操作失败，请重试":error.getMessage(),"LOCAL_STORE_ERROR");}});}
    @Override protected void handleOnDestroy(){if(speech!=null){speech.stop();speech.shutdown();}worker.execute(()->{if(database!=null){database.close();database=null;}});worker.shutdown();}
}

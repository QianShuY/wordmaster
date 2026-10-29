package io.wordmaster.g0prototype;

import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.*;
import java.lang.reflect.Method;
import org.junit.*;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

/** Requires an Android runtime. These tests are compiled into the test APK;
 * never report them executed merely because the APK builds. */
@RunWith(AndroidJUnit4.class)
public class MobileStoreInstallTest {
 private Context context;
 @Before public void prepare(){context=InstrumentationRegistry.getInstrumentation().getTargetContext();context.deleteDatabase("wordmaster-mobile.db");context.deleteDatabase("wordmaster.db");}
 private SQLiteDatabase open() throws Exception {MobileStorePlugin plugin=new MobileStorePlugin(){@Override public Context getContext(){return context;}};Method m=MobileStorePlugin.class.getDeclaredMethod("db");m.setAccessible(true);return (SQLiteDatabase)m.invoke(plugin);}
 private int scalar(SQLiteDatabase db,String sql){try(Cursor c=db.rawQuery(sql,null)){assertTrue(c.moveToFirst());return c.getInt(0);}}
 @Test public void freshSeedHasLatestFiveBooksAndEmptyPersonalState() throws Exception {SQLiteDatabase db=open();try{assertEquals(5,scalar(db,"SELECT COUNT(*) FROM wordbooks"));assertEquals(27666,scalar(db,"SELECT COUNT(*) FROM words"));assertEquals(27666,scalar(db,"SELECT COUNT(*) FROM words WHERE example<>'' AND example_translation<>''"));assertEquals(0,scalar(db,"SELECT COUNT(*) FROM progress"));assertEquals(0,scalar(db,"SELECT COUNT(*) FROM review_log"));}finally{db.close();}}
 @Test public void legacyFileAndEditedContentArePreservedAcrossOneTimeMigration() throws Exception {
  File old=context.getDatabasePath("wordmaster.db");old.getParentFile().mkdirs();try(InputStream in=context.getAssets().open("wordmaster-seed.db");OutputStream out=new FileOutputStream(old)){byte[] b=new byte[65536];int n;while((n=in.read(b))!=-1)out.write(b,0,n);}
  SQLiteDatabase legacy=SQLiteDatabase.openDatabase(old.getPath(),null,SQLiteDatabase.OPEN_READWRITE);String key;try(Cursor c=legacy.rawQuery("SELECT word_key FROM words WHERE book_key='builtin:cet6' LIMIT 1",null)){assertTrue(c.moveToFirst());key=c.getString(0);}legacy.execSQL("UPDATE words SET example='My edited example.' WHERE word_key=?",new Object[]{key});legacy.execSQL("INSERT INTO progress(word_key,correct,wrong,streak,next_due,first_studied) VALUES(?,3,1,2,'2026-11-01','2026-10-27')",new Object[]{key});legacy.close();long bytes=old.length();
  SQLiteDatabase db=open();try{assertEquals(1,scalar(db,"SELECT COUNT(*) FROM progress WHERE correct=3 AND wrong=1"));assertEquals(1,scalar(db,"SELECT COUNT(*) FROM words WHERE example='My edited example.'"));assertEquals(1,scalar(db,"SELECT COUNT(*) FROM wordbooks WHERE book_key='builtin:zhongkao' AND archived=1"));}finally{db.close();}
  assertEquals(bytes,old.length());legacy=SQLiteDatabase.openDatabase(old.getPath(),null,SQLiteDatabase.OPEN_READONLY);try{assertEquals(1,scalar(legacy,"SELECT COUNT(*) FROM progress WHERE correct=3 AND wrong=1"));}finally{legacy.close();}
  db=open();try{assertEquals(1,scalar(db,"SELECT COUNT(*) FROM progress"));}finally{db.close();}
 }
}

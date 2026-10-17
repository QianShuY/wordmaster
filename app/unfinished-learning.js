'use strict';
const Domain=require('../shared/domain');
// Recover unfinished work from saved answers, independently of browser/day checkpoints.
function unfinishedWords(db,bookId){
 const rows=db.prepare(`SELECT w.*,p.first_studied,p.next_due,0 is_new,
  EXISTS(SELECT 1 FROM recall_cycles c WHERE c.word_id=w.id AND json_extract(c.state_json,'$.complete')=0) recall_pending,
  EXISTS(SELECT 1 FROM review_log l WHERE l.word_id=w.id AND l.practice_mode='meaning' AND l.correct=1) meaning_passed,
  EXISTS(SELECT 1 FROM review_log l WHERE l.word_id=w.id AND l.practice_mode='spelling' AND l.correct=1) spelling_passed
  FROM words w JOIN progress p ON p.word_id=w.id
  WHERE w.book_id=? AND p.first_studied IS NOT NULL
  AND (EXISTS(SELECT 1 FROM recall_cycles c WHERE c.word_id=w.id AND json_extract(c.state_json,'$.complete')=0)
   OR (NOT EXISTS(SELECT 1 FROM review_log l WHERE l.word_id=w.id AND l.practice_mode='spelling' AND l.correct=1)
    AND ((p.correct=0 AND p.wrong=0) OR EXISTS(SELECT 1 FROM review_log l WHERE l.word_id=w.id AND l.practice_mode IN ('meaning','spelling')))))
  ORDER BY p.first_studied,w.id`).all(bookId);
 return rows.filter(w=>w.recall_pending||!w.meaning_passed||Domain.isSpellableWord(w.headword||w.word));
}
module.exports={unfinishedWords};

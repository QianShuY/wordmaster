'use strict';
// Numbered senses require an explicit reviewed identity, never a spelling fallback.
function matchesSenseIdentity(binding, word) {
 const number=word.homograph??null, reviewed= binding.homograph??null;
 if(number!==null||reviewed!==null){
  return Number.isInteger(number)&&number>0&&number===reviewed
   &&Number.isInteger(binding.source_line)&&binding.source_line===word.source_line
   &&typeof binding.headword==='string'&&binding.headword===word.headword;
 }
 return binding.headword===undefined||binding.headword===word.headword;
}
module.exports={matchesSenseIdentity};

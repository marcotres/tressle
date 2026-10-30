const LETTERS="ABCDEFGHILMNOPRSTUV";
export function getDailyChallenge(date=new Date()){
 const key=date.toISOString().slice(0,10);
 // Stable UTC date hash: every player receives the same letter on the same day.
 let hash=0;for(const char of key)hash=(hash*31+char.charCodeAt(0))>>>0;
 return {date:key,letter:LETTERS[hash%LETTERS.length]};
}
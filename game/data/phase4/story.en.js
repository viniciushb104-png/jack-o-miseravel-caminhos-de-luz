if(localStorage.getItem("jack-language")==="en"){
window.PHASE4_STORY=Object.freeze({
 title:"The Road of the Forgotten",
 theme:"Being forgotten does not mean never having existed.",
 opening:Object.freeze([
  {speaker:"JACK",portrait:"jack",expression:1,text:"The leaves are falling again. That's new."},
  {speaker:"JACK",portrait:"jack",expression:2,text:"My lantern stopped pointing backward too. I'm not sure I like that."},
  {speaker:"JACK",portrait:"jack",expression:1,text:"...a wall?"},
  {speaker:"JACK",portrait:"jack",expression:3,text:"No door. No lock. Of course."},
  {speaker:"JACK",portrait:"jack",expression:1,text:"Mara, I hope you knew what you were giving me."}
 ]),
 door:Object.freeze([
  {speaker:"JACK",portrait:"jack",expression:3,text:"The key is warm."},
  {speaker:"JACK",portrait:"jack",expression:1,text:"There's no lock."},
  {speaker:"JACK",portrait:"jack",expression:2,text:"A key for a door that disappeared. Finally, something simple."},
  {speaker:"???",text:"The road remembers."},
  {speaker:"JACK",portrait:"jack",expression:1,text:"Then let's see what it forgot."}
 ]),
 pilgrimMeeting:Object.freeze([
  {speaker:"PILGRIM",portrait:"pilgrim",expression:3,text:"Do you still have a name?"},
  {speaker:"JACK",portrait:"jack",expression:2,text:"I have a few. Most aren't polite."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:4,text:"I had one."},
  {speaker:"JACK",portrait:"jack",expression:1,text:"Had?"},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:4,text:"I knew it when I arrived here."},
  {speaker:"JACK",portrait:"jack",expression:1,text:"Then we'll find it."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:4,text:"What if it isn't here anymore?"},
  {speaker:"JACK",portrait:"jack",expression:5,text:"Everything leaves some kind of trace."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:3,text:"You believe that?"},
  {speaker:"JACK",portrait:"jack",expression:1,text:"I have to believe in something."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:1,text:"Then I'm coming with you."},
  {speaker:"JACK",portrait:"jack",expression:2,text:"You sure? I have a habit of finding trouble."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:6,text:"Standing still isn't giving me anything back either."},
  {speaker:"JACK",portrait:"jack",expression:5,text:"That part I understand."}
 ]),
 tracesSolved:Object.freeze([
  {speaker:"PILGRIM",portrait:"pilgrim",expression:4,text:"It isn't my name."},
  {speaker:"JACK",portrait:"jack",expression:1,text:"No."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:3,text:"But I came back. I helped someone cross... and then I came back again."},
  {speaker:"JACK",portrait:"jack",expression:1,text:"Alone."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:4,text:"I was afraid."},
  {speaker:"JACK",portrait:"jack",expression:5,text:"And you went anyway."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:5,text:"So that was me too?"},
  {speaker:"JACK",portrait:"jack",expression:5,text:"It was something you did. Sometimes that's a better place to begin than a sign."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:2,text:"Maybe I haven't lost everything."},
  {speaker:"JACK",portrait:"jack",expression:2,text:"That's already more than this road wanted to leave behind."}
 ]),
 prototypeEnd:Object.freeze([
  {speaker:"PILGRIM",portrait:"pilgrim",expression:3,text:"The signs here are blank."},
  {speaker:"JACK",portrait:"jack",expression:1,text:"Not blank. Disturbed."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:3,text:"You see a difference?"},
  {speaker:"JACK",portrait:"jack",expression:1,text:"Forgetting usually leaves absence. This left marks."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:1,text:"Then we look for the marks."},
  {speaker:"JACK",portrait:"jack",expression:4,text:"And with luck, we find out who worked so hard to hide them."}
 ]),
 archiveEvidence:Object.freeze([
  Object.freeze({x:5005,title:"EVIDENCE I · THE CUTOUT",short:"CUTOUT",prompt:"E · EXAMINE CUT PAGE",
   text:"The page is intact except for the exact strip where the name should be.",
   dialogue:Object.freeze([
    {speaker:"PILGRIM",portrait:"pilgrim",expression:3,text:"The rest of the page is still here."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Date, address, notes... everything."},
    {speaker:"PILGRIM",portrait:"pilgrim",expression:4,text:"Except the name."},
    {speaker:"JACK",portrait:"jack",expression:5,text:"Forgetting doesn't use a ruler."},
    {speaker:"PILGRIM",portrait:"pilgrim",expression:1,text:"Someone cut out only what identified the person."}
   ])}),
  Object.freeze({x:5380,title:"EVIDENCE II · THE MARKS",short:"PLAQUES",prompt:"E · EXAMINE EMPTY MOUNTS",
   text:"The mounts still have bent screws and clean outlines where plaques were torn away.",
   dialogue:Object.freeze([
    {speaker:"PILGRIM",portrait:"pilgrim",expression:5,text:"There are dozens of identical spaces."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"And the screws were forced out."},
    {speaker:"PILGRIM",portrait:"pilgrim",expression:3,text:"Why take the plaques and leave the records?"},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Because whoever did this didn't want to erase stories."},
    {speaker:"PILGRIM",portrait:"pilgrim",expression:1,text:"They wanted the names."}
   ])}),
  Object.freeze({x:5760,title:"EVIDENCE III · THE INVENTORY",short:"INVENTORY",prompt:"E · EXAMINE INVENTORY",
   text:"An inventory lists removed names as received items. None are marked as destroyed.",
   dialogue:Object.freeze([
    {speaker:"PILGRIM",portrait:"pilgrim",expression:5,text:"This says 'received'."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Not 'erased'. Not 'lost'."},
    {speaker:"PILGRIM",portrait:"pilgrim",expression:3,text:"Received by whom?"},
    {speaker:"???",text:"NAMES MUST NOT DISAPPEAR."},
    {speaker:"JACK",portrait:"jack",expression:4,text:"Ah. So someone decided to keep them."},
    {speaker:"PILGRIM",portrait:"pilgrim",expression:6,text:"Without asking anyone."}
   ])})
 ]),
 archiveSolved:Object.freeze([
  {speaker:"PILGRIM",portrait:"pilgrim",expression:1,text:"First they cut out the names. Then they tore down the plaques. Then they recorded their arrival."},
  {speaker:"JACK",portrait:"jack",expression:1,text:"This isn't a place that forgot."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:1,text:"It's a place someone is collecting names from."},
  {speaker:"JACK",portrait:"jack",expression:5,text:"And taking them all in the same direction."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:3,text:"The road beyond the archive."},
  {speaker:"JACK",portrait:"jack",expression:2,text:"Great. Now we have a thief, a trail, and terrible intentions."},
  {speaker:"???",text:"NO NAME SHALL BE LOST."},
  {speaker:"JACK",portrait:"jack",expression:1,text:"That doesn't sound like a threat."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:6,text:"Maybe that's worse. It sounds like a justification."}
 ]),
 bridgeFear:Object.freeze([
  {speaker:"PILGRIM",portrait:"pilgrim",expression:4,text:"I don't like this bridge."},
  {speaker:"JACK",portrait:"jack",expression:2,text:"It doesn't seem to like us either."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:4,text:"No. It's the height."},
  {speaker:"JACK",portrait:"jack",expression:1,text:"You remember being afraid?"},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:1,text:"My body remembers."},
  {speaker:"JACK",portrait:"jack",expression:5,text:"Fear is a trace too."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:3,text:"Is that supposed to comfort me?"},
  {speaker:"JACK",portrait:"jack",expression:2,text:"Not particularly. But it means the fear is still yours."}
 ]),
 bridgeNameGlitch:Object.freeze([
  {speaker:"PILGRIM",portrait:"pilgrim",expression:5,text:"Jack... that sign lit up when you passed."},
  {speaker:"JACK",portrait:"jack",expression:1,text:"It should record who crossed."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:5,text:"It's trying to write something."},
  {speaker:"JACK",portrait:"jack",expression:3,text:"J..."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:5,text:"Gone."},
  {speaker:"JACK",portrait:"jack",expression:1,text:"Try again."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:1,text:"That wasn't me."},
  {speaker:"JACK",portrait:"jack",expression:5,text:"I know."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:3,text:"The road can't remember you either?"},
  {speaker:"JACK",portrait:"jack",expression:1,text:"Looks like it's trying to forget the wrong person."}
 ]),
 bridgeCrossed:Object.freeze([
  {speaker:"PILGRIM",portrait:"pilgrim",expression:4,text:"I'm still afraid."},
  {speaker:"JACK",portrait:"jack",expression:1,text:"Good."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:5,text:"Good?"},
  {speaker:"JACK",portrait:"jack",expression:5,text:"You were afraid and crossed anyway. I'd keep that part."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:2,text:"Maybe I've done that before."},
  {speaker:"JACK",portrait:"jack",expression:2,text:"Then your feet remember more about you than the signs do."}
 ]),
 stolenPlaza:Object.freeze([
  {speaker:"PILGRIM",portrait:"pilgrim",expression:3,text:"These plaques... they all feel familiar."},
  {speaker:"JACK",portrait:"jack",expression:1,text:"Maybe because they were torn from the same place as the records."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:4,text:"What if one of them is mine?"},
  {speaker:"JACK",portrait:"jack",expression:5,text:"Then your name may be here."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:4,text:"And me?"},
  {speaker:"JACK",portrait:"jack",expression:1,text:"You're here with me. Don't confuse the two."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:5,text:"There are voices among the plaques."},
  {speaker:"JACK",portrait:"jack",expression:4,text:"Then let's listen before someone decides to catalogue those too."}
 ]),
 plazaEchoes:Object.freeze([
  Object.freeze({x:8125,title:"ECHO I · THE BREAD",short:"SMELL OF BREAD",text:"A voice remembers the smell of bread before dawn, but no plaque responds to it.",
   dialogue:Object.freeze([
    {speaker:"VOICE",text:"I loved the smell of bread before dawn."},
    {speaker:"PILGRIM",portrait:"pilgrim",expression:5,text:"I... know that smell."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"Knowing it doesn't mean the voice is yours."},
    {speaker:"PILGRIM",portrait:"pilgrim",expression:4,text:"And no plaque answered."},
    {speaker:"JACK",portrait:"jack",expression:5,text:"Then someone separated the memory from the name."}
   ])}),
  Object.freeze({x:8440,title:"ECHO II · THE LAUGH",short:"A LAUGH",text:"The voice remembers someone laughing when she got angry. The matching name remains impossible to identify.",
   dialogue:Object.freeze([
    {speaker:"VOICE",text:"Someone always laughed when I got angry."},
    {speaker:"PILGRIM",portrait:"pilgrim",expression:3,text:"I remember that."},
    {speaker:"JACK",portrait:"jack",expression:3,text:"Are you sure this time?"},
    {speaker:"PILGRIM",portrait:"pilgrim",expression:3,text:"No. I'm only sure of the feeling."},
    {speaker:"JACK",portrait:"jack",expression:5,text:"Maybe that's exactly what he can't keep on a plaque."}
   ])}),
  Object.freeze({x:8740,title:"ECHO III · THE STORM",short:"A HAND IN THE STORM",text:"A voice remembers holding someone's hand during a storm. The name remains somewhere else.",
   dialogue:Object.freeze([
    {speaker:"VOICE",text:"I held someone's hand through a storm. I didn't let go until it passed."},
    {speaker:"PILGRIM",portrait:"pilgrim",expression:1,text:"That memory is mine."},
    {speaker:"JACK",portrait:"jack",expression:1,text:"How do you know?"},
    {speaker:"PILGRIM",portrait:"pilgrim",expression:3,text:"I don't know anyone's name in it. But I remember the fear in the other person's hand."},
    {speaker:"JACK",portrait:"jack",expression:5,text:"Then he kept the label. You kept what actually happened."}
   ])})
 ]),
 plazaSolved:Object.freeze([
  {speaker:"PILGRIM",portrait:"pilgrim",expression:3,text:"The voices are still here. The plaques too. But they aren't together."},
  {speaker:"JACK",portrait:"jack",expression:1,text:"He isn't preserving people."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:1,text:"He's preserving names."},
  {speaker:"JACK",portrait:"jack",expression:1,text:"As if owning a name meant owning the person who lived."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:4,text:"What if my name is among them?"},
  {speaker:"JACK",portrait:"jack",expression:5,text:"It will still be yours to choose. Not his."}
 ]),
 collectorGlimpse:Object.freeze([
  {speaker:"???",portrait:"collector",expression:0,text:"NAMES ARE WHAT REMAIN WHEN EVERYTHING ELSE DISAPPEARS."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:5,text:"He's there."},
  {speaker:"JACK",portrait:"jack",expression:1,text:"Only part of him."},
  {speaker:"???",portrait:"collector",expression:0,text:"I KEPT THEM WHEN NO ONE ELSE DID."},
  {speaker:"JACK",portrait:"jack",expression:4,text:"Keeping usually doesn't require ripping things away."},
  {speaker:"???",portrait:"collector",expression:0,text:"YOU STILL CARRY A NAME. YOU WOULD NOT UNDERSTAND."},
  {speaker:"JACK",portrait:"jack",expression:1,text:"Funny. The road just disagreed with you."}
 ]),
 collectorApproach:Object.freeze([
  {speaker:"PILGRIM",portrait:"pilgrim",expression:4,text:"If he has my name..."},
  {speaker:"JACK",portrait:"jack",expression:1,text:"You decide what to do with it."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:3,text:"What if I want it back?"},
  {speaker:"JACK",portrait:"jack",expression:4,text:"Then we take it back."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:3,text:"What if I discover I don't need it?"},
  {speaker:"JACK",portrait:"jack",expression:5,text:"Then we keep walking."}
 ]),
 arenaEdge:Object.freeze([
  {speaker:"PILGRIM",portrait:"pilgrim",expression:1,text:"You're going in alone?"},
  {speaker:"JACK",portrait:"jack",expression:1,text:"Only until I find out what's in there."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:6,text:"That's what reckless people say before doing something reckless."},
  {speaker:"JACK",portrait:"jack",expression:2,text:"Good. You're getting your critical judgment back."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:4,text:"Jack."},
  {speaker:"JACK",portrait:"jack",expression:5,text:"I'll come back."}
 ]),
 collectorBossIntro:Object.freeze([
  {speaker:"COLLECTOR",portrait:"collector",expression:1,text:"YOU ENTERED A PLACE WHERE NO NAME NEEDS TO DIE."},
  {speaker:"JACK",portrait:"jack",expression:1,text:"Funny. They look trapped."},
  {speaker:"COLLECTOR",portrait:"collector",expression:1,text:"TRAPPED? I SAVED THEM."},
  {speaker:"JACK",portrait:"jack",expression:4,text:"You tore names away from people who were still using them."},
  {speaker:"COLLECTOR",portrait:"collector",expression:1,text:"PEOPLE DISAPPEAR. NAMES CAN REMAIN."},
  {speaker:"JACK",portrait:"jack",expression:1,text:"Then let's see what remains when you let some go."}
 ]),
 collectorArmorBreak:Object.freeze([
  {speaker:"COLLECTOR",portrait:"collector",expression:2,text:"STOP. THEY WILL BE FORGOTTEN."},
  {speaker:"JACK",portrait:"jack",expression:1,text:"You don't know that."},
  {speaker:"COLLECTOR",portrait:"collector",expression:3,text:"WITHOUT THEM, NOTHING REMAINS."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:6,text:"Then why can I still see you?"},
  {speaker:"COLLECTOR",portrait:"collector",expression:3,text:"..."},
  {speaker:"JACK",portrait:"jack",expression:5,text:"I think we've reached the part your collection can't answer."}
 ]),
 collectorActTwo:Object.freeze([
  {speaker:"COLLECTOR",portrait:"collector",expression:4,text:"GIVE THEM BACK."},
  {speaker:"JACK",portrait:"jack",expression:4,text:"They were never yours."},
  {speaker:"COLLECTOR",portrait:"collector",expression:4,text:"I KEPT THEM ALIVE."},
  {speaker:"JACK",portrait:"jack",expression:1,text:"You kept labels alive. The people went on without you."}
 ]),
 collectorExhausted:Object.freeze([
  {speaker:"COLLECTOR",portrait:"collector",expression:5,text:"NO..."},
  {speaker:"COLLECTOR",portrait:"collector",expression:5,text:"WITHOUT THE NAMES..."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:5,text:"He got smaller."},
  {speaker:"JACK",portrait:"jack",expression:1,text:"No. Now we're seeing the size he always was."},
  {speaker:"COLLECTOR",portrait:"collector",expression:5,text:"IF NO ONE SAYS MY NAME... WHAT REMAINS?"}
 ]),
 collectorRecognized:Object.freeze([
  {speaker:"JACK",portrait:"jack",expression:5,text:"You."},
  {speaker:"COLLECTOR",portrait:"collector",expression:6,text:"..."},
  {speaker:"JACK",portrait:"jack",expression:1,text:"Before the name. After it. You."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:3,text:"So being remembered isn't the same as being possessed by a word."},
  {speaker:"JACK",portrait:"jack",expression:5,text:"Apparently not."},
  {speaker:"COLLECTOR",portrait:"collector",expression:6,text:"I DON'T KNOW WHAT TO DO WITHOUT THEM."},
  {speaker:"JACK",portrait:"jack",expression:1,text:"You can start by releasing what was never yours."}
 ]),
 collectorRelease:Object.freeze([
  {speaker:"COLLECTOR",portrait:"collector",expression:7,text:"IF I RELEASE THE NAMES... THEY MAY DISAPPEAR."},
  {speaker:"JACK",portrait:"jack",expression:1,text:"They may also return to whoever wants to carry them."},
  {speaker:"COLLECTOR",portrait:"collector",expression:7,text:"AND THE ONES NO ONE CLAIMS?"},
  {speaker:"JACK",portrait:"jack",expression:5,text:"They still belonged to someone."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:1,text:"You don't have to possess something to admit it existed."},
  {speaker:"COLLECTOR",portrait:"collector",expression:7,text:"...THEN I CAN LET GO."}
 ]),
 pilgrimChoice:Object.freeze([
  {speaker:"PILGRIM",portrait:"pilgrim",expression:4,text:"Maybe my name is among them."},
  {speaker:"JACK",portrait:"jack",expression:1,text:"It may be."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:4,text:"I spent so long waiting for him to tell me who I was."},
  {speaker:"JACK",portrait:"jack",expression:5,text:"And now?"},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:2,text:"Now I remember that I came back. I supported someone. I was afraid. I crossed."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:0,text:"If I ever want my name back, I'll look for it."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:6,text:"But I won't stand here waiting for it anymore."},
  {speaker:"JACK",portrait:"jack",expression:5,text:"Sounds like a good way to keep existing."}
 ]),
 bellGift:Object.freeze([
  {speaker:"PILGRIM",portrait:"pilgrim",expression:0,text:"Before I go... I woke on this road with this in my pocket."},
  {speaker:"JACK",portrait:"jack",expression:1,text:"A bell."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:2,text:"No name. No inscription. It still rings."},
  {speaker:"JACK",portrait:"jack",expression:2,text:"We're developing a pattern."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:2,text:"Keep it."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:1,text:"If you find someone who forgot where they were going... call."},
  {speaker:"JACK",portrait:"jack",expression:1,text:"Even without knowing the name?"},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:2,text:"Especially then."}
 ]),
 jackPromiseMemory:Object.freeze([
  {speaker:"???",text:"You promised."},{speaker:"JACK",portrait:"jack",expression:3,text:"..."},
  {speaker:"JACK'S MEMORY",text:"I'll come back."},{speaker:"JACK",portrait:"jack",expression:1,text:"I said that."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:5,text:"To whom?"},{speaker:"JACK",portrait:"jack",expression:3,text:"I still don't remember."},
  {speaker:"???",text:"Find the way back."},{speaker:"JACK",portrait:"jack",expression:5,text:"At least now I know what I promised."}
 ]),
 phase4Farewell:Object.freeze([
  {speaker:"PILGRIM",portrait:"pilgrim",expression:3,text:"Are you going to wait for that door to open?"},
  {speaker:"JACK",portrait:"jack",expression:1,text:"No."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:3,text:"Even without knowing where it leads?"},
  {speaker:"JACK",portrait:"jack",expression:5,text:"Standing still hasn't helped either of us so far."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:2,text:"Then I'll go this way."},
  {speaker:"JACK",portrait:"jack",expression:1,text:"And I'll keep following the road."},
  {speaker:"PILGRIM",portrait:"pilgrim",expression:2,text:"Without knowing where it ends?"},
  {speaker:"JACK",portrait:"jack",expression:2,text:"That never seemed to be a requirement."}
 ]),
 traceReveals:Object.freeze([
  Object.freeze([
   {speaker:"PILGRIM",portrait:"pilgrim",expression:3,text:"These tracks reach the ditch..."},
   {speaker:"JACK",portrait:"jack",expression:1,text:"And turn back."},
   {speaker:"PILGRIM",portrait:"pilgrim",expression:5,text:"Why?"},
   {speaker:"JACK",portrait:"jack",expression:5,text:"Maybe whoever left them realized someone had been left behind."}
  ]),
  Object.freeze([
   {speaker:"PILGRIM",portrait:"pilgrim",expression:5,text:"Now there are two people."},
   {speaker:"JACK",portrait:"jack",expression:1,text:"One was limping. The other slowed down."},
   {speaker:"PILGRIM",portrait:"pilgrim",expression:1,text:"She was supporting the injured person."},
   {speaker:"JACK",portrait:"jack",expression:5,text:"We don't need her name to know that."}
  ]),
  Object.freeze([
   {speaker:"PILGRIM",portrait:"pilgrim",expression:3,text:"The second trail goes away..."},
   {speaker:"JACK",portrait:"jack",expression:1,text:"But these tracks come back."},
   {speaker:"PILGRIM",portrait:"pilgrim",expression:4,text:"Alone."},
   {speaker:"JACK",portrait:"jack",expression:5,text:"Deeper in the mud. More tired. And heading toward danger."},
   {speaker:"PILGRIM",portrait:"pilgrim",expression:4,text:"I know that fear."}
  ])
 ]),
 traces:Object.freeze([
  Object.freeze({x:3520,title:"Trace I",memoryLabel:"CAME BACK",text:"Tracks reach the ditch, stop... and return to find someone who was left behind."}),
  Object.freeze({x:3910,title:"Trace II",memoryLabel:"SUPPORTED",text:"Two trails continue together. One limps; the other slows down and supports them."}),
  Object.freeze({x:4300,title:"Trace III",memoryLabel:"CAME BACK AGAIN",text:"The injured person goes on. The same tracks return alone, deeper in the mud."})
 ]),
 sections:Object.freeze([
  Object.freeze({x:0,name:"THE DOOR THAT DOESN'T EXIST"}),
  Object.freeze({x:1050,name:"THE ROAD WITHOUT SIGNS"}),
  Object.freeze({x:2150,name:"THE NAMELESS SETTLEMENT"}),
  Object.freeze({x:3250,name:"THE FIELD OF TRACKS"}),
  Object.freeze({x:4700,name:"THE REDACTED ARCHIVE"}),
  Object.freeze({x:6100,name:"THE BRIDGE OF NOBODIES"}),
  Object.freeze({x:7900,name:"THE SQUARE OF STOLEN NAMES"}),
  Object.freeze({x:9300,name:"THE COLLECTOR'S HOUSE"}),
  Object.freeze({x:10600,name:"THE COLLECTOR'S ARENA"})
 ])
});}
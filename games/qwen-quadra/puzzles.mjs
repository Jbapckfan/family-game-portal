// Boards 1–16 preserve Qwen's supplied QUADRA prototype verbatim.
// Boards 17–30 are additional editorial content by ChatGPT.
const BOARDS = [
 ['Weather',['RAIN','SNOW','WIND','HAIL']],
 ['Money',['CASH','COIN','NOTE','BILL']],
 ['Animals',['BEAR','LION','WOLF','DEER']],
 ['Colors',['BLUE','CYAN','GOLD','TEAL']],
 ['Fruits',['PEAR','PLUM','KIWI','LIME']],
 ['Vehicles',['BOAT','SHIP','TAXI','TRAM']],
 ['Car parts',['HOOD','DOOR','SEAT','TIRE']],
 ['Communication',['CHAT','TEXT','CALL','MAIL']],
 ['Grammar',['NOUN','VERB','CASE','MOOD']],
 ['Chess',['KING','ROOK','PAWN','MATE']],
 ['Gemstones',['OPAL','RUBY','JADE','ONYX']],
 ['Music genres',['JAZZ','ROCK','SOUL','FUNK']],
 ['Length units',['MILE','YARD','FOOT','INCH']],
 ['Beverages',['BEER','WINE','COLA','MILK']],
 ['Shapes',['CUBE','CONE','OVAL','STAR']],
 ['Birds',['CROW','DOVE','SWAN','HAWK']],
 ['Body parts',['HAND','FOOT','HEAD','KNEE']],
 ['Kitchen verbs',['BOIL','BAKE','STIR','PEEL']],
 ['Things in the sky',['MOON','STAR','KITE','BIRD']],
 ['At the beach',['SAND','SURF','TIDE','WAVE']],
 ['Reading and writing',['BOOK','READ','PAGE','WORD']],
 ['Playing-card ranks',['KING','JACK','NINE','FIVE']],
 ['Sports',['GOLF','POLO','JUDO','SUMO']],
 ['Clothing',['COAT','SOCK','VEST','ROBE']],
 ['Cooking ingredients',['SALT','RICE','OATS','CORN']],
 ['Plant parts',['ROOT','STEM','LEAF','SEED']],
 ['Parts of a home',['ROOM','WALL','ROOF','HALL']],
 ['Computer terms',['FILE','BYTE','DATA','CODE']],
 ['On a farm',['PLOW','BARN','HENS','GOAT']],
 ['Parts of the face',['EYES','NOSE','LIPS','CHIN']],
];
function shuffle(letters,seed){
 const values=[...letters];let n=seed>>>0;
 for(let i=values.length-1;i>0;i--){n=(Math.imul(n,1664525)+1013904223)>>>0;const j=n%(i+1);[values[i],values[j]]=[values[j],values[i]];}
 return values;
}
export const PUZZLES=BOARDS.map(([category,answers],i)=>({id:`quadra-${i+1}`,category,answers,tiles:shuffle(answers.join(''),0x716c39+i*104729)}));

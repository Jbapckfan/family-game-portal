// Additional editorial content by ChatGPT, October 2026.
// These are authored puzzle inputs, not quotations or an imported dictionary.
const rows = text => text.trim().split('\n').map(line => line.split(' | '));

export const CIPHER_CONTENT = rows(`
A MAP CAN SHOW A ROAD BUT NOT THE VIEW | A journey offers something a drawing cannot capture.
THE FIRST STAR MAKES THE EVENING FEEL WIDE | A small light changes the scale of the sky.
A WARM KITCHEN GATHERS PEOPLE TOGETHER | The heart of a home can be a room with a stove.
THE GARDEN KEEPS A CALENDAR OF ITS OWN | Flowers announce the passing seasons.
A GOOD RECIPE LEAVES ROOM FOR YOUR TASTE | Cooking combines instructions with personal choices.
RAIN GIVES THE DUSTY PATH A FRESH START | A shower changes the appearance of a familiar trail.
THE WINDOW FRAMES A DIFFERENT SKY EACH DAY | The same opening offers an ever-changing picture.
A LONG WALK MAKES A SHORT STORY GROW | Time outdoors supplies something to talk about.
THE SMALLEST SEED CAN FILL A CORNER WITH GREEN | A garden begins with very little.
FAMILIAR STREETS STILL HAVE UNFAMILIAR DETAILS | Careful attention can refresh a routine journey.
A PAPER BOAT NEEDS ONLY A PUDDLE FOR ADVENTURE | Imagination gives a tiny craft a grand voyage.
THE LAST PAGE CAN SEND YOU BACK TO THE FIRST | A surprising ending invites another reading.
A BORROWED BOOK CARRIES TWO KINDS OF STORIES | A volume has its contents and its journey between readers.
THE MOON ADDS A QUIET LAMP TO THE GARDEN | An evening scene receives light from above.
A FULL TABLE BEGINS WITH AN EMPTY PLACE SETTING | Preparing to welcome someone comes before the meal.
THE DOG KNOWS WHICH DOOR LEADS TO THE WALK | An eager companion recognizes a familiar routine.
A WINDOW BOX CAN TURN A SILL INTO A GARDEN | A little space can hold growing things.
THE SOUND OF RAIN CHANGES WITH THE ROOF | One kind of weather creates different music overhead.
A SANDCASTLE MAKES A SMALL BEACH KINGDOM | A holiday creation rules a very modest territory.
THE NEXT CHAPTER WAITS ON THE OTHER SIDE OF A PAGE | Reading advances through a small physical movement.
A SHARP PENCIL IS AN INVITATION TO BEGIN | A simple writing tool can encourage a fresh idea.
THE WIND REARRANGES THE LEAVES WITHOUT A PLAN | A breeze performs an untidy outdoor task.
A CLEAR NIGHT MAKES THE SKY A MUCH LARGER ROOM | Looking upward can expand a sense of space.
THE BICYCLE TURNS A FAMILIAR ROAD INTO A RIDE | Two wheels offer a different way to enjoy a route.
A QUIET MORNING LEAVES SPACE FOR SMALL SOUNDS | Stillness makes little noises easier to notice.
THE CORNER SHOP HOLDS MORE THAN THINGS TO BUY | A neighborhood business can also be a meeting place.
A LOOSE THREAD CAN REVEAL HOW SOMETHING WAS MADE | One tiny detail exposes a larger structure.
THE GATE OPENS ON A PATH YOU HAVE NOT TAKEN | A small boundary marks the start of an unfamiliar route.
A GOOD QUESTION CAN KEEP A CONVERSATION MOVING | Curiosity helps people continue talking.
THE PICNIC BEGINS WHEN THE BLANKET TOUCHES THE GRASS | An outdoor meal has a simple opening ceremony.
A BRIGHT BUTTON CAN CHANGE A PLAIN OLD COAT | A small alteration refreshes a familiar garment.
THE RIVER CARRIES REFLECTIONS WITHOUT KEEPING THEM | Moving water briefly holds the surrounding scene.
A KIND WELCOME MAKES A STRANGE PLACE FEEL SMALLER | Hospitality makes unfamiliar surroundings easier to enter.
THE CLOCK MARKS TIME WHILE THE BAKER MARKS DOUGH | Two workers measure progress in different ways.
A LANTERN MAKES A CIRCLE OF COMFORT IN THE DARK | A portable light defines a welcoming little space.
THE OLD BENCH HAS A NEW VIEW IN EVERY SEASON | Staying in one place still reveals change.
A FOLDED NOTE CAN HOLD A LARGE THANK YOU | A modest piece of paper carries meaningful appreciation.
THE BRIDGE JOINS TWO WALKS INTO ONE JOURNEY | A crossing connects routes on separate sides.
A FRESH COAT OF PAINT CAN BRIGHTEN A FAMILIAR DOOR | An ordinary entrance receives a colorful renewal.
THE HILL HIDES THE VIEW UNTIL YOU REACH THE TOP | A climb saves its reward for the end.
A FULL MOON NEEDS NO STREET TO LIGHT | A bright object above reaches places without roads.
THE BOOKMARK SAVES A PLACE FOR YOUR RETURN | A small strip remembers where reading paused.
A NEW WORD CAN GIVE AN OLD IDEA A CLEARER SHAPE | Vocabulary helps make a thought easier to express.
THE KETTLE ANNOUNCES A BREAK BEFORE THE CUP IS READY | A kitchen sound signals time to pause.
A NEAT ROW OF SEEDS BEGINS AN UNTIDY SUMMER | An orderly start grows into a lively garden.
THE BIRD BATH TURNS A GARDEN INTO A MEETING PLACE | A shallow bowl attracts feathered visitors.
A SLOW TRAIN GIVES THE LANDSCAPE TIME TO SPEAK | A leisurely journey allows more observation.
THE TIDE WRITES A NEW EDGE ALONG THE SAND | Water redraws a shoreline.
A GOOD LIST MAKES A LARGE JOB FEEL SMALLER | Dividing a task into parts makes it manageable.
THE FIRST PANCAKE TELLS YOU ABOUT THE PAN | An early cooking attempt provides useful feedback.
A CLEAN WINDOW MAKES THE WHOLE ROOM FEEL BRIGHTER | Removing a little dirt improves the light indoors.
THE HEDGE LEAVES A SMALL DOOR FOR THE HEDGEHOG | A garden boundary can make room for wildlife.
A COLORFUL SCARF CAN CARRY SUMMER INTO WINTER | Clothing adds warmth in more than one sense.
THE MAILBOX COLLECTS NEWS FROM PLACES YOU CANNOT SEE | A familiar container receives messages from elsewhere.
A LITTLE SHADE CAN MAKE A LONG WALK PLEASANT | Relief from sunshine improves a journey on foot.
THE STREET LOOKS DIFFERENT FROM THE TOP OF A BUS | A higher seat changes an ordinary view.
A HOME MADE CARD SHOWS THE HAND THAT MADE IT | A personal greeting retains traces of its creation.
THE GOLDFISH TURNS A GLASS BOWL INTO A SMALL WORLD | A simple container becomes a living scene.
A TINY BELL CAN ANNOUNCE A VERY LARGE VISITOR | The size of a signal need not match its source.
THE FERRY MAKES THE WATER PART OF THE ROAD | A boat carries a land journey across a gap.
A BASKET OF APPLES BRINGS THE ORCHARD INDOORS | Harvested fruit carries a little of its growing place home.
THE FIRST FOOTPRINT CHANGES A PERFECT FIELD OF SNOW | One step marks an untouched winter scene.
A HAND DRAWN MAP CAN INCLUDE THE BEST PLACE TO STOP | Personal knowledge adds something useful to directions.
THE GARDEN WALL HOLDS WARMTH AFTER THE SUN HAS GONE | A familiar structure can retain the afternoon heat.
A LIGHT IN THE HALL MAKES THE HOUSE FEEL AWAKE | One illuminated space changes the mood of a building.
THE TRAIN WINDOW TURNS FIELDS INTO MOVING PICTURES | Travel supplies a changing landscape without a screen.
A LOST MITTEN CAN TURN UP IN THE OTHER COAT | A missing winter item may be hiding in a familiar place.
THE CLOUDS CHANGE THE PICTURE WITHOUT MOVING THE FRAME | Looking through one window reveals a shifting sky.
A LITTLE FLOUR ON THE TABLE TELLS A STORY OF BREAD | A cooking trace hints at the work that happened there.
THE GARDEN HOSE DRAWS RAINBOWS ON A SUNNY DAY | Water and light can create a colorful garden display.
A NEW PATH OF STONES CAN GUIDE FAMILIAR FEET | A modest garden change alters an everyday route.
THE LAST BUS HOME CAN FEEL LIKE A MOVING LIVING ROOM | A late journey may offer familiar comfort.
A SMALL SHELF CAN KEEP A GREAT MANY WORLDS | A compact place for books holds expansive stories.
THE FIRST BLOSSOM PUTS A DATE ON THE BRANCH | A flower announces a seasonal arrival.
A HANDSHAKE CAN BEGIN A LONG FRIENDSHIP | A brief greeting may lead to an enduring connection.
THE OLD RECIPE HAS NEW STAINS FROM ANOTHER GOOD MEAL | Signs of use record repeated success in the kitchen.
A WALK AFTER RAIN HAS A DIFFERENT KIND OF LIGHT | Wet surfaces change an outdoor scene.
THE GULL SEES THE HARBOR AS A PLACE TO LAND | A bird views a busy waterfront through its own needs.
A SOFT RUG MAKES A HARD FLOOR FEEL FRIENDLIER | A simple furnishing changes the comfort of a room.
THE CARDBOARD BOX BECOMES A CASTLE WHEN PLAY BEGINS | Imagination transforms everyday packaging.
A ROW OF LANTERNS MAKES A PATH THROUGH THE EVENING | Several small lights guide an outdoor journey.
THE GARDENER READS THE SEASON IN THE SOIL | Familiar work brings knowledge of changing conditions.
A GREAT DAY CAN START WITH A VERY SMALL PLAN | An enjoyable outing needs only a modest beginning.
THE SPARE CHAIR LEAVES ROOM FOR AN UNEXPECTED GUEST | One extra place makes an invitation possible.
A SUNNY WINDOW CAN BE THE BEST SEAT IN THE HOUSE | Light turns an ordinary spot into a favorite.
THE PENCIL MARKS SHOW HOW THE IDEA FOUND ITS SHAPE | A drawing retains the history of its development.
A QUIET CORNER CAN MAKE A BUSY DAY FEEL BALANCED | A little restful space offsets activity.
THE FIRST NOTE INVITES THE REST OF THE SONG | Music begins with one small sound.
A POCKET NOTEBOOK GIVES PASSING IDEAS A PLACE TO STAY | A portable writing space helps preserve thoughts.
THE OPEN DOOR MAKES THE GARDEN PART OF THE ROOM | An entrance links indoor and outdoor space.
`);

export const TRAIL_CONTENT = rows(`
ADVENTURE | An exciting experience with an uncertain outcome.
AFTERNOON | The part of the day between noon and evening.
AIRPLANES | Winged vehicles that fly through the sky.
ALLIGATOR | A large reptile with a broad snout and powerful tail.
APARTMENT | A separate home within a larger residential building.
ASTRONAUT | A person trained to travel and work in space.
BASEBALLS | The stitched white balls used in a bat-and-ball sport.
BATHROOMS | Rooms containing a bath, shower, or toilet.
BIRTHDAYS | Annual celebrations of the days people were born.
BLACKBIRD | A familiar bird named for its dark plumage.
BOOKCASES | Pieces of furniture with shelves for books.
BOOKMARKS | Strips or other markers that keep your place in books.
BOOKSHOPS | Stores where readers can buy volumes to read.
BREAKFAST | The first meal of the day.
CALENDARS | Charts that organize the days, weeks, and months of a year.
CAMPFIRES | Outdoor fires around which campers gather.
CARNATION | A flower with frilled petals, often given in bouquets.
CARPENTER | A skilled worker who builds and repairs things made of wood.
CARTWHEEL | A sideways gymnastic turn with hands and feet touching the ground in sequence.
CELEBRATE | To mark a happy or important occasion with festivities.
CHAMELEON | A lizard famous for changing its skin color.
CHAMPIONS | Winners who hold first place in a competition.
CHECKLIST | A written set of items to tick off as they are completed.
CHILDHOOD | The early period of life before becoming an adult.
CLASSROOM | A room in which a group of students is taught.
CLIPBOARD | A portable board with a clip that holds sheets of paper.
COASTLINE | The boundary where land meets the sea.
COLORLESS | Having no hue or tint.
COMPASSES | Instruments with needles that help people find direction.
COMPUTERS | Electronic machines that process information and run programs.
CORKSCREW | A spiral tool used to pull a stopper from a bottle.
COURTYARD | An open area enclosed by the walls of a building.
CUPBOARDS | Storage cabinets with doors and shelves.
DAREDEVIL | Someone who enjoys taking bold and risky chances.
DAYDREAMS | Pleasant imagined scenes that occupy the waking mind.
DETECTIVE | A person who investigates clues to solve a mystery.
DISCOVERY | The act of finding or learning something for the first time.
DISHCLOTH | A small piece of fabric used to wash kitchenware.
DOORBELLS | Devices that ring to announce visitors at an entrance.
EARTHWORM | A long, legless creature that lives and burrows in soil.
EGGPLANTS | Glossy purple vegetables also known as aubergines.
ENVELOPES | Folded paper coverings used to hold letters for mailing.
EVERGREEN | A plant that keeps its green leaves throughout the year.
FARMHOUSE | The main home on a piece of agricultural land.
FEATHERED | Covered with the light plumage of a bird.
FIREWORKS | Explosive displays that create colorful lights in the sky.
FISHERMAN | A person who catches fish for work or recreation.
FLASHBULB | A small lamp once used to provide a bright burst of light for photographs.
FLOWERPOT | A container in which a decorative plant can grow.
FOOTBALLS | Inflated balls used in games played on a field with goals or goalposts.
FOOTPRINT | A mark left on the ground by a foot or shoe.
FORESIGHT | The ability to anticipate what may be needed in the future.
FRUITCAKE | A rich baked cake containing dried or candied fruit.
GARDENING | The activity of growing and tending flowers or other plants.
GLASSWARE | Drinking vessels and other objects made from glass.
GOLDSMITH | A craftsperson who makes objects from a precious yellow metal.
GRAPEVINE | A climbing plant that produces bunches of small juicy fruit.
GREETINGS | Words or gestures used to welcome someone.
GUIDEBOOK | A book with useful information about a place or subject.
HANDSHAKE | A greeting made by briefly clasping another person's hand.
HARMONICA | A small wind instrument played by blowing and drawing air through reeds.
HATCHLING | A young animal that has recently emerged from an egg.
HEADLIGHT | A lamp at the front of a vehicle that lights the road ahead.
HIGHLIGHT | The most memorable or outstanding part of an experience.
HOMEBOUND | Confined to one's home.
HOMEGROWN | Cultivated in one's own garden or local area.
HORSESHOE | A curved metal plate fitted to an animal's hoof.
HOUSEBOAT | A vessel equipped to serve as someone's home.
IMPORTANT | Having great significance or value.
INVENTION | A new device or process created through ingenuity.
JELLYBEAN | A small bean-shaped sweet with a soft center.
KEYBOARDS | Sets of keys used to type into computers or play certain instruments.
KNAPSACKS | Bags carried on the back, often for walking or hiking.
LADYBIRDS | Small spotted beetles also known as ladybugs.
LANDMARKS | Recognizable features that help identify a place.
LETTERBOX | A slot or container through which mail is delivered.
LIGHTBULB | The replaceable part of a lamp that produces illumination.
LUNCHTIME | The part of the day set aside for the midday meal.
MAGNIFIER | A lens that makes small things appear larger.
MAILBOXES | Containers where letters are delivered or collected.
MARMALADE | A preserve made from citrus fruit, often including pieces of peel.
MATCHBOOK | A small cardboard cover holding a row of paper matches.
MEASURING | Finding the size, length, or amount of something.
MILESTONE | A significant stage or achievement along the way.
MILKSHAKE | A cold drink made by blending milk with flavoring or ice cream.
MISTLETOE | A plant with white berries traditionally hung during winter festivities.
MOONLIGHT | The soft illumination reflected from Earth's natural satellite.
MOTORBIKE | A motorized vehicle with two wheels.
MUSHROOMS | Fungi with caps and stalks, some of which are used in cooking.
NEIGHBORS | People who live nearby.
NEWSPAPER | A printed publication containing current reports and articles.
NIGHTFALL | The time when daylight fades and darkness begins.
ORCHESTRA | A large group of musicians playing string, wind, and percussion instruments.
`);

// Each pool is an explicit editorial category. Generated boards keep four
// distinct four-letter answers and a unique complete partition of their rack.
export const QUADRA_POOLS = rows(`
Weather | RAIN SNOW WIND HAIL MIST GALE GUST HAZE
Money and banking | CASH COIN NOTE BILL CENT EURO DIME DEBT LOAN BANK
Animals | BEAR LION WOLF DEER HARE MOLE LYNX GOAT LAMB MULE SEAL TOAD NEWT FROG
Colors | BLUE CYAN GOLD TEAL PINK GRAY PLUM ROSE JADE LIME AQUA
Vehicles | BOAT SHIP TAXI TRAM JEEP SLED CART RAFT BIKE
Car parts | HOOD DOOR SEAT TIRE HORN AXLE GEAR RIMS
Communication | CHAT TEXT CALL MAIL TALK SIGN TELL HEAR
Grammar and language | NOUN VERB CASE MOOD PAST STEM ROOT WORD
Chess | KING ROOK PAWN MATE DRAW FORK FILE RANK
Music genres | JAZZ ROCK SOUL FUNK FOLK TRAP
Beverages | BEER WINE COLA MILK SODA MEAD SAKE
Shapes | CUBE CONE OVAL STAR KITE RING LINE DISK
Birds | CROW DOVE SWAN HAWK WREN LARK IBIS KIWI RHEA TERN LOON DUCK GULL
Body parts | HAND FOOT HEAD KNEE NECK BACK NOSE CHIN LUNG HEEL PALM FACE
Kitchen verbs | BOIL BAKE STIR PEEL CHOP DICE WHIP BEAT SEAR
Things in the sky | MOON STAR KITE BIRD MIST HAZE RAIN SNOW
At the beach | SAND SURF TIDE WAVE DUNE CLAM CRAB GULL KELP
Reading and writing | BOOK READ PAGE WORD POEM TALE TEXT NOTE LINE EDIT
Clothing | COAT SOCK VEST ROBE GOWN CAPE KILT SUIT
Cooking ingredients | SALT RICE OATS CORN LARD HERB LIME MILK
Parts of a home | ROOM WALL ROOF HALL DOOR GATE STEP FLUE
Computer terms | FILE BYTE DATA CODE DISK FONT ICON CHIP
On a farm | PLOW BARN HENS GOAT COWS PIGS CROP SOIL SEED
In the garden | RAKE HOSE PLOW FORK SEED SOIL POTS SHED
At the bakery | CAKE TART LOAF BUNS ROLL PIES FLAN
Musical instruments | HARP HORN OBOE DRUM LUTE BASS GONG PIPE
Things used in sports | BALL BATS NETS PADS TEES GOAL PINS PUCK
Ways to move on foot | WALK JUMP SKIP STEP PACE TROT LIMP RUSH
Feelings | FEAR LOVE HOPE RAGE CALM ENVY GLEE HATE
Periods of time | DAYS WEEK HOUR YEAR EONS AGES
` ).map(([category, words]) => ({category, words: words.split(' ')}));

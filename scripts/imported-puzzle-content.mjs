// Additional editorial content by Alford Daily, October 2026.
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

// Six-month continuation: original phrases and precise nine-letter definitions.
// Kept separate so the already published generator prefix is reproducible.
export const SIX_MONTH_CIPHER_CONTENT = rows(`
THE VIOLIN CASE HOLDS A CONCERT WAITING TO BEGIN | A portable instrument is ready for its next performance.
A TRAFFIC LIGHT GIVES A BUSY CROSSING A SHARED RHYTHM | Colored signals coordinate travelers at an intersection.
THE POTTER LEAVES A THUMBPRINT BENEATH THE GLAZE | A handmade vessel retains a small mark of its maker.
A TICKET STUB CAN BRING BACK THE WHOLE PERFORMANCE | A little souvenir recalls an evening of entertainment.
THE MUSEUM LABEL OPENS A DOOR INTO ANOTHER CENTURY | A short explanation gives an old object historical context.
A SINGLE LOOSE SCREW CAN GIVE THE CHAIR A VOICE | An unstable piece of furniture may announce itself with a squeak.
THE JUGGLER MAKES A CAREFUL PATTERN LOOK LIKE CHAOS | A skilled performer controls several objects in the air.
A FRESH SHEET OF MUSIC HOLDS A ROOM FULL OF SOUND | Written notes await the musicians who will play them.
THE COMPASS NEEDLE KEEPS ITS PROMISE WHEN THE PATH TURNS | A direction finder remains useful along a winding route.
A PAIR OF BINOCULARS BRINGS THE FAR HILLS CLOSER | An optical tool enlarges a distant view.
THE ELEVATOR CARRIES A SMALL CROWD BETWEEN FLOORS | A moving compartment provides a vertical journey.
A WELL FITTED LID CAN MAKE A SIMPLE JAR USEFUL AGAIN | Repairing a closure restores an everyday container.
THE WHEELBARROW MAKES ONE TRIP OUT OF SEVERAL ARMLOADS | A wheeled garden tool moves a heavy collection efficiently.
A MARBLE FINDS EVERY SLOPE IN AN OLD WOODEN FLOOR | A rolling toy reveals small changes in level.
THE CHESSBOARD TURNS A QUIET TABLE INTO A CONTEST | A game creates a strategic struggle in a peaceful room.
A NEW BRIDGE CHANGES THE MEANING OF THE OTHER SIDE | A crossing makes previously separated places easier to reach.
THE REHEARSAL MAKES ROOM FOR MISTAKES BEFORE THE SHOW | Practice allows performers to improve away from an audience.
A ZIPPER JOINS TWO EDGES WITH A SINGLE SMALL JOURNEY | A sliding fastener brings separated sides together.
THE PIANO NEEDS MANY KEYS TO OPEN ITS KIND OF DOOR | An instrument offers access to music through its keyboard.
A HELMET TAKES UP LITTLE SPACE BESIDE A BICYCLE | Protective equipment fits easily with a two-wheeled vehicle.
THE LIBRARY RETURNS SILENCE WITH EVERY BORROWED BOOK | A shared reading place offers a quiet kind of exchange.
A ROW OF OARS TURNS SEPARATE EFFORTS INTO ONE MOTION | Coordinated rowing drives a boat forward.
THE STAGE CURTAIN HIDES A WORLD UNTIL THE LIGHTS DIM | A theater waits to reveal its prepared scene.
A STITCH CAN JOIN FABRIC AND SAVE A FAVORITE SHIRT | A small repair preserves a familiar garment.
THE TELESCOPE MAKES A DISTANT MOON PART OF THE EVENING | An astronomical instrument improves a night-sky view.
A SCALED DRAWING LETS A LARGE BUILDING FIT ON A DESK | A plan represents a full-sized structure on paper.
THE COFFEE GRINDER ANNOUNCES THE MORNING IN A NEW WAY | A kitchen appliance provides a familiar early sound.
A SIMPLE LEVER GIVES A SMALL PUSH A LARGER EFFECT | A basic machine changes how force is applied.
THE SHIP LEAVES THE HARBOR WITH A CITY AT ITS BACK | A vessel begins a voyage away from an urban waterfront.
A LABEL ON A SEED PACKET DESCRIBES A FUTURE FLOWER | Gardening packaging shows what its contents may become.
THE KNITTING NEEDLES TURN A LINE INTO A SURFACE | Repeated loops transform yarn into fabric.
A PARKING METER MEASURES A VERY SMALL PIECE OF THE CITY | A roadside device regulates time spent in one space.
THE SCULPTOR FINDS A FIGURE INSIDE A ROUGH BLOCK | An artist removes material to reveal a shape.
A WET PAINT SIGN PROTECTS MORE THAN THE WALL | A warning also helps keep clothing clean.
THE HIKER COUNTS SWITCHBACKS WHILE THE VALLEY GROWS SMALL | A winding climb increases the distance from low ground.
A HINGE DOES ITS BEST WORK WHEN NOBODY NOTICES IT | A well-functioning joint lets a door move quietly.
THE SURVEYOR MEASURES THE HILL BEFORE THE ROAD ARRIVES | Careful land measurement precedes construction.
A BALANCED SCALE MAKES TWO DIFFERENT PILES AGREE | Equal weights can be shown despite different contents.
THE TRUMPET TURNS A BREATH INTO A BRIGHT ANNOUNCEMENT | A brass instrument transforms air into a strong sound.
A PLUMB LINE GIVES GRAVITY A VISIBLE DIRECTION | A hanging weight helps identify the vertical.
THE STATION CLOCK BELONGS TO EVERYONE WHO IS WAITING | A shared timepiece matters to many travelers.
A BOOK SPINE IS A SMALL SIGNPOST ON A CROWDED SHELF | A narrow label helps a reader locate a volume.
THE OVEN DOOR HOLDS BACK THE WARMTH OF AN UNFINISHED MEAL | Cooking continues inside a heated enclosure.
A MAGNET FINDS THE STEEL PINS AMONG THE WOODEN SHAVINGS | A tool separates certain metal objects from debris.
THE CABIN WINDOW TURNS A SNOWSTORM INTO A PICTURE | Shelter makes wintry weather something to watch comfortably.
A CAMERA TRIPOD LENDS A STEADY HAND TO THE PHOTOGRAPHER | Three legs support a device during a picture.
THE TENNIS NET DIVIDES THE COURT AND CONNECTS THE GAME | A sporting barrier defines play between opponents.
A RAILWAY TUNNEL GIVES THE MOUNTAIN A SHORTCUT | Engineering provides a route through high ground.
THE DRUMMER KEEPS THE DANCERS TALKING WITH THEIR FEET | A steady beat guides movement without words.
A FOUNTAIN PEN CARRIES A SMALL RESERVOIR OF STORIES | A writing instrument holds ink for future sentences.
THE FISHING FLOAT WAITS WHERE TWO WORLDS MEET | A small indicator rests at the surface of water.
A SKETCH OF A FACE BEGINS WITH A FEW CHOSEN LINES | A portrait can emerge from very simple marks.
THE STAIR RAIL OFFERS A HAND ALL THE WAY UP | A fixed support accompanies a climb indoors.
A WAX SEAL TURNS A CLOSED LETTER INTO A SMALL CEREMONY | A traditional finish makes correspondence feel formal.
THE TRACTOR LEAVES PARALLEL LINES ACROSS THE FIELD | Farm machinery produces an orderly pattern on the land.
A BELL TOWER SENDS THE HOUR ACROSS THE ROOFTOPS | A high structure announces time to a neighborhood.
THE ACROBAT TRUSTS THE ROPE AND THE HOURS OF PRACTICE | A performer relies on equipment and preparation.
A WOVEN BASKET MAKES MANY THIN STRIPS WORK TOGETHER | Interlaced material forms a useful container.
THE TAILOR READS A MEASURING TAPE LIKE A MAP | A clothing maker uses dimensions to plan a fit.
A WATER WHEEL TURNS A PASSING STREAM INTO WORK | Flowing liquid powers a rotating mechanism.
THE ROWING BOAT LEAVES TWO TRAILS THAT SOON DISAPPEAR | Oars briefly mark the water behind a small craft.
A GLASS PRISM SHOWS HOW MANY COLORS HID IN THE LIGHT | An optical object separates a beam into a spectrum.
THE CRANE LIFTS A BEAM TOWARD AN UNFINISHED SKYLINE | Heavy equipment helps a building take shape.
A DRY STONE WALL HOLDS TOGETHER WITHOUT A DROP OF MORTAR | Carefully placed rocks form a boundary on their own.
THE SUNDIAL READS THE DAY FROM THE SHAPE OF A SHADOW | A timekeeping device relies on the position of sunlight.
A ROLL OF FILM ONCE HELD A HOLIDAY IN THE DARK | Photographic material stored unseen pictures before development.
THE CABLE CAR BORROWS A ROAD FROM THE AIR | A suspended vehicle travels above the ground.
A HAND PUMP ASKS FOR EFFORT BEFORE IT OFFERS WATER | A manually operated device lifts liquid for use.
THE EMBROIDERY HOOP HOLDS A LITTLE GARDEN OF THREAD | A sewing frame supports a decorative floral design.
A TURNING WINDMILL MAKES THE INVISIBLE BREEZE VISIBLE | Moving blades reveal the action of air.
THE POSTCARD FITS A FARAWAY VIEW INTO ONE HAND | A small mailed picture represents a distant place.
A SHOPPING BASKET GROWS HEAVIER AS THE LIST GROWS SHORTER | Collecting groceries makes two measures move oppositely.
THE SAILOR TRIMS THE SAIL TO MAKE A FRIEND OF THE WIND | Adjusting canvas helps a boat use the breeze.
A MOSAIC MAKES A WHOLE PICTURE FROM SMALL DIFFERENCES | Separate colored pieces form one image.
THE ARCH HOLDS ITS STONES IN A CAREFUL CONVERSATION | A curved structure depends on the relationship of its parts.
A READING LAMP CAN MAKE A LATE TRAIN FEEL LIKE HOME | A little directed light gives a journey familiar comfort.
THE WEAVER CHANGES DIRECTION WITHOUT LEAVING THE LOOM | Repeated passes create cloth within a fixed frame.
A COMPASS AND A MAP MAKE BETTER PARTNERS THAN RIVALS | Two navigation tools provide complementary information.
THE WORKSHOP SMELLS OF WOOD BEFORE THE FIRST CUT | Stored timber gives a craft space a recognizable scent.
A QUIET APPLAUSE STILL TELLS THE PERFORMER THANK YOU | A modest response can express appreciation for a show.
`);

export const SIX_MONTH_TRAIL_CONTENT = rows(`
NEWSPAPER | A printed publication containing current reports and articles.
NIGHTFALL | The time when daylight fades and darkness begins.
ORCHESTRA | A large ensemble of string, wind, and percussion musicians.
ACCORDION | A portable instrument with a bellows and a keyboard.
PASSENGER | A traveler in a vehicle who is not driving it.
PATCHWORK | Fabric made by sewing smaller pieces together.
AEROPLANE | A winged flying vehicle, using the British spelling.
PERISCOPE | A viewing instrument used to look above a submarine.
AVALANCHE | A large mass of snow rapidly descending a mountainside.
BADMINTON | A racket sport played by hitting a shuttlecock over a net.
POLICEMAN | A male officer who enforces the law.
PORCUPINE | A rodent protected by a coat of sharp quills.
POSTCARDS | Small cards mailed with a picture and a written message.
POTTERIES | Workshops where clay vessels are made and fired.
PRACTICAL | Useful and suited to real tasks rather than theory alone.
PRESCHOOL | An educational setting for children below primary school age.
PRINTABLE | Suitable for putting on paper with a printer.
PROJECTOR | A device that casts enlarged images onto a screen.
BALLERINA | A woman who performs classical ballet.
QUICKSAND | Loose wet ground that can yield beneath a person's weight.
RAINCOATS | Waterproof outer garments worn during wet weather.
RECYCLING | Processing used materials so they can be used again.
DOLLHOUSE | A miniature home furnished for small toy figures.
ROADBLOCK | A barrier placed across a route to stop traffic.
BARRICADE | An improvised barrier blocking a road or entrance.
SAILBOATS | Boats propelled primarily by wind caught in canvas.
SANDPAPER | Abrasive sheets used to smooth a surface.
SATELLITE | An object that travels in orbit around a planet.
SCRAPBOOK | An album containing pasted photographs and other keepsakes.
BEEKEEPER | Someone who maintains colonies of honey-producing insects.
SEASHELLS | Hard outer coverings of marine mollusks found on beaches.
SHIPWRECK | The remains of a vessel destroyed or sunk at sea.
SHOEMAKER | A craftsperson who constructs or repairs footwear.
SHOPFRONT | The outward-facing entrance and windows of a store.
SHOULDERS | Body parts where the arms connect to the torso.
SIDEWALKS | Paved paths for pedestrians alongside roads.
SNOWBOARD | A single wide board ridden downhill over packed snow.
SNOWSTORM | Severe weather with falling flakes and often strong wind.
SOMETHING | An unspecified object, action, or matter.
SPAGHETTI | Pasta made in long thin cylindrical strands.
SPARKLING | Shining with small bright flashes of light.
SPECTACLE | An impressive or unusual sight attracting attention.
SPOTLIGHT | A lamp producing a focused beam on a performer or object.
STAIRCASE | A connected set of steps between different floor levels.
BILINGUAL | Able to speak two languages.
STEAMBOAT | A vessel driven by an engine powered with heated water vapor.
STORYBOOK | A volume containing tales, often for young readers.
STRONGBOX | A sturdy locked container for valuables.
SUBMARINE | A vessel designed to operate beneath the sea.
LAMPSHADE | A covering that diffuses and directs light from a lamp.
SURFBOARD | A long narrow board ridden on breaking waves.
SWEETCORN | A variety of maize eaten for its tender sugary kernels.
BOARDWALK | A path made of wooden planks, often beside a beach.
TANGERINE | A small orange citrus fruit with easily removed peel.
TEACHABLE | Able and willing to learn from instruction.
TELEGRAPH | A system for transmitting coded messages over a wire.
THUMBNAIL | The hard covering on the end of the broadest finger.
TIMETABLE | A schedule giving planned times for events or journeys.
BRIEFCASE | A flat handled case used to carry work documents.
TOOTHACHE | Pain felt in a tooth or the area surrounding it.
BUTTERCUP | A small wildflower with glossy yellow petals.
CASSEROLE | A dish of mixed ingredients cooked together in an oven.
CENTIPEDE | A many-legged arthropod with one pair of legs per body segment.
TREASURED | Held in high personal value and cared for closely.
TREEHOUSE | A small structure built among the branches above ground.
TRIATHLON | A race combining swimming, cycling, and running.
UMBRELLAS | Portable canopies held overhead to keep off rain.
UNDERPASS | A route that travels beneath another road or railway.
VEGETABLE | An edible plant or plant part served in savory meals.
VOLUNTEER | Someone who offers to help without being required to do so.
WALLPAPER | Decorative paper applied to the inside walls of a room.
WANDERING | Moving from place to place without a fixed route.
WASHCLOTH | A small piece of fabric used for cleaning the body.
CHOPSTICK | One of a pair of slender sticks used to pick up food.
CROISSANT | A flaky buttery pastry traditionally shaped like a crescent.
WHEELBASE | The distance between the front and rear axles of a vehicle.
WHIRLPOOL | Water rotating rapidly around a central depression.
DRIFTWOOD | Timber carried and deposited by moving water.
WINDBREAK | A barrier of trees or fencing that reduces the force of air.
WORKBENCH | A sturdy table used for practical craft or repair tasks.
`);

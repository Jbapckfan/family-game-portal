/**
 * TrackFixes - obstacles removed after automated playtesting
 *
 * Each level's chute is generated from its id. A look-ahead pilot then plays
 * every level with four marbles (default, heavy, bouncy, slick); any obstacle
 * one of them cannot get past is listed here (by index in the sorted obstacle
 * list) and left out, so every level is proven completable.
 */
window.TRACK_FIXES = {"1-2":[6],"1-3":[4,11,14,17],"1-6":[4,5],"1-7":[10],"1-8":[12],"1-9":[11,12],"1-10":[9,16],"2-1":[6,12,14],"2-2":[1,4],"2-4":[8],"2-5":[3],"2-6":[15,2],"2-8":[3,10],"2-9":[12,13,17],"2-10":[13],"3-2":[5],"3-3":[8,6,7,14],"3-4":[0],"3-6":[3,5],"3-7":[7],"3-9":[2],"3-10":[6],"4-1":[1],"4-2":[1,2,5],"4-3":[6],"4-4":[5,9],"4-6":[5],"4-7":[2],"4-8":[8,10],"4-9":[4,8],"4-10":[3],"5-1":[12,7],"5-2":[3],"5-4":[3,7,13],"5-6":[7,5],"5-8":[2,6],"5-10":[2,10,11,7],"6-1":[0,12,1,9,7,14],"6-3":[4,7],"6-6":[3],"6-8":[6],"6-9":[10,8],"6-10":[3],"7-2":[2,3],"7-7":[1],"7-8":[10],"7-9":[1]};
// Bends a heavy marble flew out of at speed: the chute closes into a tube over the stretch
window.TRACK_WALLS = {"3-3":[[1134,1168]],"6-2":[[1548,1600]]};

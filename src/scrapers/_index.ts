import { AbstractScraper } from '@/abstract-scraper'
import type { ScraperOptions } from '@/types/scraper.interface'

import { ACoupleCooks } from './acouplecooks'
import { AmbitiousKitchen } from './ambitiouskitchen'
import { AmericasTestKitchen } from './americastestkitchen'
import { BarefootContessa } from './barefootcontessa'
import { BBCFood } from './bbcfood'
import { BBCGoodFood } from './bbcgoodfood'
import { BettyCrocker } from './bettycrocker'
import { BigOven } from './bigoven'
import { BongEats } from './bongeats'
import { BrianLagerstrom } from './brianlagerstrom'
import { CookingCircle } from './cookingcircle'
import { CookingLight } from './cookinglight'
import { CooksCountry } from './cookscountry'
import { CooksIllustrated } from './cooksillustrated'
import { Costco } from './costco'
import { DamnDelicious } from './damndelicious'
import { Delish } from './delish'
import { DomesticateMe } from './domesticateme'
import { Epicurious } from './epicurious'
import { FoodAndWine } from './foodandwine'
import { ForksOverKnives } from './forksoverknives'
import { GoodHousekeeping } from './goodhousekeeping'
import { GreatBritishChefs } from './greatbritishchefs'
import { HELLOFRESH_COUNTRY_HOSTS, HelloFresh } from './hellofresh'
import { HersheyLand } from './hersheyland'
import { HomeChef } from './homechef'
import { InspiredTaste } from './inspiredtaste'
import { JamieOliver } from './jamieoliver'
import { JoshuaWeissman } from './joshuaweissman'
import { JustOneCookbook } from './justonecookbook'
import { KingArthur } from './kingarthur'
import { LoveAndLemons } from './loveandlemons'
import { Maangchi } from './maangchi'
import { McCormick } from './mccormick'
import { MyPlate } from './myplate'
import { NYTimes } from './nytimes'
import { OnceUponAChef } from './onceuponachef'
import { PopSugar } from './popsugar'
import { PurpleCarrot } from './purplecarrot'
import { QuakerOats } from './quakeroats'
import { SaboresAjinomoto } from './saboresajinomoto'
import { SimplyRecipes } from './simplyrecipes'
import { Skinnytaste } from './skinnytaste'
import { SouthernLiving } from './southernliving'
import { SpisBedre } from './spisbedre'
import { Sunset } from './sunset'
import { TasteAU } from './tasteau'
import { TasteOfHome } from './tasteofhome'
import { TastingHistory } from './tastinghistory'
import { TheCleverCarrot } from './theclevercarrot'
import { TheKitchn } from './thekitchn'
import { TheModernProper } from './themodernproper'
import { ThePioneerWoman } from './thepioneerwoman'
import { TheSpruceEats } from './thespruceeats'
import { TudoGostoso } from './tudogostoso'
import { WeightWatchers } from './weightwatchers'
import { WholeFoodsMarket } from './wholefoodsmarket'
import { WilliamsSonoma } from './williamssonoma'

/**
 * Constructor type for scraper classes.
 */
type ScraperClass = {
  new (html: string, url: string, options?: ScraperOptions): AbstractScraper
  host(): string
  schemaOrgOnly?: boolean
}

/**
 * Scrapers with custom extraction logic.
 * Adding a new scraper only requires adding it to this list.
 */
const customScraperClasses = [
  ACoupleCooks,
  AmbitiousKitchen,
  AmericasTestKitchen,
  BarefootContessa,
  BBCFood,
  BBCGoodFood,
  BettyCrocker,
  BigOven,
  BongEats,
  BrianLagerstrom,
  CookingCircle,
  CookingLight,
  CooksCountry,
  CooksIllustrated,
  Costco,
  DamnDelicious,
  Delish,
  DomesticateMe,
  Epicurious,
  FoodAndWine,
  ForksOverKnives,
  GoodHousekeeping,
  GreatBritishChefs,
  HelloFresh,
  HersheyLand,
  HomeChef,
  InspiredTaste,
  JamieOliver,
  JoshuaWeissman,
  JustOneCookbook,
  KingArthur,
  LoveAndLemons,
  Maangchi,
  McCormick,
  MyPlate,
  NYTimes,
  OnceUponAChef,
  PopSugar,
  PurpleCarrot,
  QuakerOats,
  SaboresAjinomoto,
  SimplyRecipes,
  Skinnytaste,
  SouthernLiving,
  SpisBedre,
  Sunset,
  TasteAU,
  TasteOfHome,
  TastingHistory,
  TheCleverCarrot,
  TheKitchn,
  TheModernProper,
  ThePioneerWoman,
  TheSpruceEats,
  TudoGostoso,
  WeightWatchers,
  WholeFoodsMarket,
  WilliamsSonoma,
] as const satisfies readonly ScraperClass[]

/**
 * Hosts that can rely on generic schema.org extraction
 * and do not need dedicated scraper classes.
 */
const SCHEMA_ORG_ONLY_HOSTS = [
  'addapinch.com',
  'afarmgirlsdabbles.com',
  'aflavorjournal.com',
  'akispetretzikis.com',
  'altonbrown.com',
  'allrecipes.com',
  'archanaskitchen.com',
  'bestrecipes.com.au',
  'blueapron.com',
  'bonappetit.com',
  'bowlofdelicious.com',
  'brasspine.com',
  'budgetbytes.com',
  'eatingwell.com',
  'chefjeanpierre.com',
  'chewoutloud.com',
  'familyfoodonthetable.com',
  'food.com',
  'halfbakedharvest.com',
  'howtofeedaloon.com',
  'inbloombakery.com',
  'indianhealthyrecipes.com',
  'joyfoodsunshine.com',
  'lecremedelacrumb.com',
  'marmiton.org',
  'marthastewart.com',
  'natashaskitchen.com',
  'noracooks.com',
  'norecipes.com',
  'organicallyaddison.com',
  'recipetineats.com',
  'savorynothings.com',
  'seriouseats.com',
  'simplegreensmoothies.com',
  'sunbasket.com',
  'sweetcsdesigns.com',
  'tastesbetterfromscratch.com',
  'tasty.co',
  'tastyoven.com',
  'thebigmansworld.com',
  'thecookierookie.com',
  'theincrediblebulks.com',
  'themediterraneandish.com',
  'therecipecritic.com',
  'unsophisticook.com',
  'wellplated.com',
  'zestfulkitchen.com',
  '101cookbooks.com',
  '365daysofbakingandmore.com',
  'abeautifulmess.com',
  'acozykitchen.com',
  'afullliving.com',
  'alexandracooks.com',
  'amazingribs.com',
  'amberskitchencooks.com',
  'anitalianinmykitchen.com',
  'asweetpeachef.com',
  'aubreyskitchen.com',
  'averiecooks.com',
  'bakerbynature.com',
  'bakewithzoha.com',
  'baking-sense.com',
  'bakingmischief.com',
  'barefeetinthekitchen.com',
  'belleofthekitchen.com',
  'bellyfull.net',
  'betterfoodguru.com',
  'biancazapatka.com',
  'biggerbolderbaking.com',
  'billyparisi.com',
  'blessthismessplease.com',
  'blogghetti.com',
  'breadtopia.com',
  'brokenovenbaking.com',
  'cafedelites.com',
  'cakemehometonight.com',
  'cakewhiz.com',
  'cambreabakes.com',
  'carlsbadcravings.com',
  'castironketo.net',
  'castironskilletcooking.com',
  'celebratingsweets.com',
  'chefkoch.de',
  'chefsavvy.com',
  'ciaoflorentina.com',
  'closetcooking.com',
  'cloudykitchen.com',
  'coleycooks.com',
  'colleenchristensennutrition.com',
  'cookedandloved.com',
  'cookieandkate.com',
  'cookingclassy.com',
  'cookinglsl.com',
  'cookingwithjanica.com',
  'cookpad.com',
  'cookwithdana.com',
  'copykat.com',
  'countryliving.com',
  'crazyforcrust.com',
  'creativecanning.com',
  'cucchiaio.it',
  'cybercook.com.br',
  'daringgourmet.com',
  'dashfordinner.com',
  'deliciouslyella.com',
  'deliciouslysprinkled.com',
  'delscookingtwist.com',
  'dinneratthezoo.com',
  'dinnerthendessert.com',
  'downshiftology.com',
  'eatingbirdfood.com',
  'eatingeuropean.com',
  'eatingonadime.com',
  'eattolerant.de',
  'eatwhattonight.com',
  'elavegan.com',
  'emilybites.com',
  'emmikochteinfach.de',
  'errenskitchen.com',
  'everyday-delicious.com',
  'everydaypie.com',
  'evolvingtable.com',
  'familyspice.com',
  'fantabulosity.com',
  'feastingathome.com',
  'feelgoodfoodie.net',
  'fifteenspatulas.com',
  'figjar.com',
  'fithealthymacros.com',
  'fitslowcookerqueen.com',
  'food52.com',
  'foodbymaria.com',
  'forktospoon.com',
  'garlicandzest.com',
  'garnishandglaze.com',
  'gimmesomeoven.com',
  'girlgonegourmet.com',
  'girlversusdough.com',
  'glutenfreeonashoestring.com',
  'godt.no',
  'gonnawantseconds.com',
  'goodstuff.recipes',
  'gousto.co.uk',
  'grandbaby-cakes.com',
  'handletheheat.com',
  'healthywithachanceofsprinkles.com',
  'heatherchristo.com',
  'heb.com',
  'homeandplate.com',
  'hostthetoast.com',
  'houseofnasheats.com',
  'houseofyumm.com',
  'howtocook.recipes',
  'hungryhappens.net',
  'iamafoodblog.com',
  'iambaker.net',
  'ica.se',
  'im-worthy.com',
  'inspiralized.com',
  'iowagirleats.com',
  'izzycooking.com',
  'jimcooksfoodgood.com',
  'jocooks.com',
  'jow.fr',
  'joyfullymad.com',
  'juliasalbum.com',
  'jumbo.com',
  'justalittlebitofbacon.com',
  'justataste.com',
  'justinesnacks.com',
  'kennethtemple.com',
  'kitchendivas.com',
  'kitchenstories.com',
  'kochbar.de',
  'koket.se',
  'kristineskitchenblog.com',
  'lanascooking.com',
  'laurenslatest.com',
  'leitesculinaria.com',
  'letscampsmore.com',
  'leukerecepten.nl',
  'littleferrarokitchen.com',
  'littlespicejar.com',
  'littlespoonfarm.com',
  'littlesunnykitchen.com',
  'lmld.org',
  'lolascocina.com',
  'lovingitvegan.com',
  'madensverden.dk',
  'madsvin.com',
  'makeitdairyfree.com',
  'mealprepmanual.com',
  'meganvskitchen.com',
  'melissaknorris.com',
  'melskitchencafe.com',
  'mexicanplease.com',
  'miljuschka.nl',
  'minimalistbaker.com',
  'ministryofcurry.com',
  'mobkitchen.co.uk',
  'modernhoney.com',
  'momontimeout.com',
  'momswithcrockpots.com',
  'mybakingaddiction.com',
  'myjewishlearning.com',
  'mykidslickthebowl.com',
  'mykitchen101en.com',
  'myrecipes.com',
  'myriadrecipes.com',
  'myvegetarianroots.com',
  'newdadskitchen.com',
  'notenoughcinnamon.com',
  'nourishedbynutrition.com',
  'nutritionfacts.org',
  'ohsheglows.com',
  'omnivorescookbook.com',
  'onesweetappetite.com',
  'ourbestbites.com',
  'paleorunningmomma.com',
  'panlasangpinoy.com',
  'peelwithzeal.com',
  'persnicketyplates.com',
  'piesandplots.net',
  'pilipinasrecipes.com',
  'pinchofyum.com',
  'pinkowlkitchen.com',
  'plantyou.com',
  'platingsandpairings.com',
  'plowingthroughlife.com',
  'practicalselfreliance.com',
  'preppykitchen.com',
  'pressureluckcooking.com',
  'purelypope.com',
  'rainbowplantlife.com',
  'realfoodwell.com',
  'realsimple.com',
  'receitas.globo.com',
  'recept.se',
  'recipeforperfection.com',
  'recipegirl.com',
  'reciperunner.com',
  'redhousespice.com',
  'relish.com',
  'ricette.giallozafferano.it',
  'sallysbakingaddiction.com',
  'sandwichtribunal.com',
  'saveur.com',
  'savoringthegood.com',
  'savorythoughts.com',
  'scrummylane.com',
  'simple-veganista.com',
  'simplyquinoa.com',
  'simplyscratch.com',
  'simplywhisked.com',
  'sipandfeast.com',
  'smalltownwoman.com',
  'sobors.hu',
  'somuchfoodblog.com',
  'southernbite.com',
  'spainonafork.com',
  'spendwithpennies.com',
  'spicysouthernkitchen.com',
  'springlane.de',
  'stacyling.com',
  'steamykitchen.com',
  'sudachirecipes.com',
  'sugarhero.com',
  'sugarmaplefarmhouse.com',
  'sugarspunrun.com',
  'sweetpeasandsaffron.com',
  'swissmilk.ch',
  'tableanddish.com',
  'tasteandtellblog.com',
  'tastefullygrace.com',
  'tastesoflizzyt.com',
  'tatyanaseverydayfood.com',
  'teakandthyme.com',
  'thealmondeater.com',
  'thecountrycook.net',
  'thefirstmess.com',
  'thefoodcharlatan.com',
  'thefoodietakesflight.com',
  'theguardian.com',
  'thekitchencommunity.org',
  'theloopywhisk.com',
  'themagicalslowcooker.com',
  'thepalatablelife.com',
  'thesaltymarshmallow.com',
  'thespicetrain.com',
  'thesuburbansoapbox.com',
  'thewoksoflife.com',
  'thewoodenskillet.com',
  'thinlicious.com',
  'thishealthytable.com',
  'toriavey.com',
  'twopeasandtheirpod.com',
  'valentinascorner.com',
  'vanillaandbean.com',
  'veganricha.com',
  'vegrecipesofindia.com',
  'wearenotmartha.com',
  'wedishitup.com',
  'whatsgabycooking.com',
  'wyseguide.com',
  'yemek.com',
] as const satisfies readonly string[]

function createSchemaOrgOnlyScraper(host: string): ScraperClass {
  return class extends AbstractScraper {
    static readonly schemaOrgOnly = true

    static host() {
      return host
    }
  }
}

const schemaOrgOnlyScraperClasses = SCHEMA_ORG_ONLY_HOSTS.map((host) =>
  createSchemaOrgOnlyScraper(host),
)

/**
 * Optional host aliases.
 * Example: 'bbc.co.uk': BBCFood
 */
const scraperAliases: Readonly<Record<string, ScraperClass>> = {
  'bbc.co.uk': BBCFood,
  'wholefoodsmarket.co.uk': WholeFoodsMarket,
  ...Object.fromEntries(HELLOFRESH_COUNTRY_HOSTS.map((host) => [host, HelloFresh])),
}

function buildScraperRegistry(
  classes: readonly ScraperClass[],
  aliases: Readonly<Record<string, ScraperClass>>,
): Record<string, ScraperClass> {
  const registry: Record<string, ScraperClass> = {}

  const registerHost = (host: string, scraper: ScraperClass, source: string) => {
    const existing = registry[host]

    if (existing && existing !== scraper) {
      throw new Error(`Duplicate scraper key '${host}' from ${source}.`)
    }

    registry[host] = scraper
  }

  for (const scraper of classes) {
    registerHost(scraper.host(), scraper, 'host()')
  }

  for (const [alias, scraper] of Object.entries(aliases)) {
    registerHost(alias, scraper, 'alias')
  }

  return registry
}

/**
 * A map of all scrapers keyed by host and aliases.
 */
export const scrapers = buildScraperRegistry(
  [...customScraperClasses, ...schemaOrgOnlyScraperClasses],
  scraperAliases,
)

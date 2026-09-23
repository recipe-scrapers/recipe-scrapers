import { AbstractScraper } from '@/abstract-scraper'
import type { ScraperOptions } from '@/types/scraper.interface'

import { AmericasTestKitchen } from './americastestkitchen'
import { BBCGoodFood } from './bbcgoodfood'
import { BongEats } from './bongeats'
import { BrianLagerstrom } from './brianlagerstrom'
import { DamnDelicious } from './damndelicious'
import { Epicurious } from './epicurious'
import { InspiredTaste } from './inspiredtaste'
import { Maangchi } from './maangchi'
import { MyPlate } from './myplate'
import { NYTimes } from './nytimes'
import { OnceUponAChef } from './onceuponachef'
import { SimplyRecipes } from './simplyrecipes'
import { Skinnytaste } from './skinnytaste'
import { TheCleverCarrot } from './theclevercarrot'

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
  AmericasTestKitchen,
  BBCGoodFood,
  BongEats,
  BrianLagerstrom,
  DamnDelicious,
  Epicurious,
  InspiredTaste,
  Maangchi,
  MyPlate,
  SimplyRecipes,
  NYTimes,
  OnceUponAChef,
  Skinnytaste,
  TheCleverCarrot,
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
  'castironketo.net',
  'castironskilletcooking.com',
  'celebratingsweets.com',
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
  'cookwithdana.com',
  'copykat.com',
  'crazyforcrust.com',
  'creativecanning.com',
  'cucchiaio.it',
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
  'healthywithachanceofsprinkles.com',
  'heatherchristo.com',
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
 * Example: 'bbc.co.uk': BBCGoodFood
 */
const scraperAliases = {
  'bbc.co.uk': BBCGoodFood,
} as const satisfies Record<string, ScraperClass>

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

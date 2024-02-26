const jsonld = require('jsonld');
const DKG = require('../index.js');

const ENVIRONMENT = 'development';
const OT_NODE_HOSTNAME = 'http://localhost';
const OT_NODE_PORT = '8902';
const PUBLIC_KEY = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const DkgClient = new DKG({
    environment: ENVIRONMENT,
    endpoint: OT_NODE_HOSTNAME,
    port: OT_NODE_PORT,
    blockchain: {
        name: 'hardhat2',
        publicKey: PUBLIC_KEY,
        privateKey: PRIVATE_KEY,
    },
    maxNumberOfRetries: 30,
    frequency: 2,
    contentType: 'all',
});
const psychohistory =
    'Psychohistory Psychohistory is a fictional science in Isaac Asimov\'s Foundation universe which combines history, sociology, and mathematical statistics to make general predictions about the future behavior of very large groups of people, such as the Galactic Empire. It was first introduced in the four short stories (1942–1944) which would later be collected as the 1951 novel Foundation. Psychohistory depends on the idea that, while one cannot foresee the actions of a particular individual, the laws of statistics as applied to large groups of people could predict the general flow of future events. Asimov used the analogy of a gas: An observer has great difficulty in predicting the motion of a single molecule in a gas, but with the kinetic theory can predict the mass action of the gas to a high level of accuracy. Asimov applied this concept to the population of his fictional Galactic Empire, which numbered one quintillion. The character responsible for the science\'s creation, Hari Seldon, established two axioms: the population whose behaviour was modelled should be sufficiently large to represent the entire society. the population should remain in ignorance of the results of the application of psychohistorical analyses because if it is aware, the group changes its behaviour. Ebling Mis added these axioms: there would be no fundamental change in the society human reactions to stimuli would remain constant. Golan Trevize in Foundation and Earth added this axiom: humans are the only sentient intelligence in the galaxy. Asimov presents the Prime Radiant, a device designed by Hari Seldon and built by Yugo Amaryl, as storing the psychohistorical equations showing the future development of humanity. The Prime Radiant projects the equations onto walls in some unexplained manner, but it does not cast shadows, thus allowing workers easy interaction. As a tool of the Second Foundation, control operates through the power of the mind, allowing the user to zoom in to details of the equations, and to change them. One can make annotations, but by convention all amendments remain anonymous. A student in the Second Foundation destined for Speakerhood has to present an amendment to the plan. Five different boards then check the mathematics rigorously. Students have to defend their proposals against concerted and merciless attacks. After two years, the change gets reviewed again. If after the second examination it still passes muster, the contribution becomes part of the Seldon Plan. In-universe Axioms The Prime Radiant The Radiant, as well as being interactive, employs a type of colour-coding to equations within itself for ready comprehension by Psychohistorians. Seldon Black are the original Seldon Plan equations developed by Seldon and Amaryl during the first four decades of Seldon\'s work at the University of Streeling, and define Seldon Crises, the Plan\'s duration, and the eventuation of the Second Galactic Empire. Speaker Red are additions to the plan by Speakers (Senior Mentalic Psychohistorians of the Second Foundation) since the time of Seldon. Deviation Blue are observed deviations away from Psychohistorical projections with a deviation in excess of 1.5 standard deviation of predicted outcomes (1.5 σ). The Era of Deviations, at the rise of the Mule, produced deviations in the Seldon Plan in excess of .5 through 10 sigmas, and the resolution of this period required a full century of labour by members of the Second Foundation, often with dangerous interventions and uncertain likelihood of success, to return the Galaxy to the Plan. Other colours have been imagined by fans, and mentioned by Asimov, such as: Notation Green – additions of pertinent scientific papers appended to findings (Forward the Foundation) Projection Purple – Useful for determining limits on future Speaker Red equations, using projections of events with regard to a very sketchy but still monumental Seldon Black scheme. A tool of the first three generations of Psychohistorians after Seldon, and by the 5th Century of the Plan a teaching tool at most. (Forward the Foundation) One year prior to the publication of his first story about psychohistory in 1942, Asimov alluded to mathematical psychology and the science of psychology eventually being as predictable as organic chemistry, in a letter to the editor of Astounding Science-Fiction. In his later career, Asimov described some historical (pre-Seldon) origins of psychohistory. In The Robots of Dawn (1983), which takes place thousands of years before Foundation (1951), he describes roboticist Han Fastolfe\'s attempts to create the science based on careful observation of others, particularly of his daughter Vasilia. Prelude to Foundation (1988) suggests that one of Fastolfe\'s robots, R. Daneel Olivaw, manipulated Seldon into practical application of this science. The fact that Seldon established a Second Foundation of mental-science adepts to oversee his Seldon Plan might suggest that even Seldon himself had doubts about the ultimate ability of a purely mathematical approach to predicting historical processes, and that he recognized that the development of psychic skills, such as those used by the Mule, had the ability to invalidate the assumptions underlying his models, though he did not (and could not) predict the appearance of the Mule himself. The Seldon methodology might therefore only work at a certain level of speciesdevelopment, and would over time become less useful. Psychohistory has one basic, underlying limitation which Asimov postulated for the first time on the last page of the final book in the Foundation series: psychohistory only functions in a galaxy populated only by humans. In Asimov\'s Foundation series, humans form the only sentient race that developed in the entire Milky Way Galaxy. Seldon developed psychohistory to predict the actions of large groups of humans. Even robots technically fall under the umbrella of psychohistory, because humans built them, and they thus represent more or less a human "action", or at least, possess a thought-framework similar enough to that of their human creators that Development Limitations psychohistory can predict their actions. However, psychohistory cannot predict the actions of a sentient alien race; their psychology may differ so much from that of humans that normal psychohistory cannot understand or predict their actions. The end of the series offered two possibilities: 1. sentient races actually very rarely develop, such that only humans evolved in the Milky Way Galaxy, and in most other galaxies, it appears probable (given this assumption) that only one sentient race would develop. However, statistically two or more alien races might evolve in the same galaxy, leading them into inevitable conflict. The fighting in this other galaxy would only end when one race emerged the victor, and after the prolonged conflict with other races, would have developed an aggressive and expansionist mindset. In contrast, humans had never encountered another sentient species in the Milky Way Galaxy, so they never felt greatly compelled to expand to other galaxies, but instead to fight other humans over control of the Milky Way. Eventually, such an aggressive alien race would expand from galaxy to galaxy, and try to invade the Milky Way Galaxy. 2. through genetic engineering, subsets of humanity could alter themselves so significantly from baseline humans that they could for all intents and purposes be considered "aliens". Specifically exemplifying this theory we find Asimov\'s Solarians: humans evolved from an old Spacer world who had genetically modified themselves into hermaphrodites with telekinetic mental powers. Seldon used psychohistory to predict that the Galactic Empire would fall: this was a generationslong process which had already begun, and was too far gone to stop. This would result in a subsequent 30,000 years of barbarism, before the various petty kingdoms of the galaxy eventually aggregated again into a Second Empire. It was possible, however, to use psychohistory to influence future events in such a way that this "Great Interregnum" was shortened from 30,000 years to a mere 1,000. To implement his plan, Seldon creates the Foundations – two groups of scientists and engineers settled at opposite ends of the galaxy – to preserve the spirit of science and civilization, and thus become the cornerstones of the new galactic empire. The First Foundation was located at Terminus, an isolated planet at the fringe of the galaxy, and was tasked with preserving and advancing scientific knowledge. As the outer provinces of the Galactic Empire fragmented politically and declined technologically, the First Foundation would maintain this advantage over them. Secretly, the Second Foundation was focused on psychohistory itself, updating Seldon\'s predictions as the generations passed and subtly influencing events to ensure that the Plan would succeed. The Seldon Plan for the First Foundation focused on ten major crises that it would face over the next thousand years. Hari Seldon made a series of holographic recordings about each crisis, set to be revealed one at a time to the Foundation at the predicted time each one occurred. The general outline of the Seldon Plan can be inferred from the Crises: 1. Balance of Power – the political fragmentation of the galaxy would begin at its outermost fringes, as the Periphery provinces split off into petty interstellar kingdoms, fifty years after the settlement of Terminus. When this came to pass, the region around Terminus itself broke up into the "Four Kingdoms", the most powerful of which was Anacreon. Each of the Four Kingdoms wanted to conquer Terminus to seize its advanced technology. The solution to this crisis was to play off each of the Four Kingdoms against each other, arranging treaties so that a direct invasion by any one of the kingdoms would be met with an immediate counterattack by the other three, ensuring the invading kingdom was defeated before they could make use of the Foundation\'s technology to defeat the other kingdoms. 2. Religion – thirty years later, one of the surrounding barbarian kingdoms would aggregate enough power that even the threat of all its neighbors united against it could no longer deter it. Seldon Plan When this came to pass, it was Anacreon. During the intervening time period, the neighboring kingdoms had pressured the Foundation to send them technological aide rather than face conquest – in turn, making them dependent on the Foundation, which actively encouraged the population of these kingdoms to revere their technology with religious awe. Thus when Anacreon attempted a direct attack on the Foundation, its own people revolted against it. 3. Trade Alone – By about 150 years into the Plan (70 years after the second crisis), the religious infiltration of the Foundation into surrounding kingdoms would begin to wear off – due to a combination of time, recovering technological base in other parts of the galaxy, or simply that other barbarian kingdoms wised up to the prior strategy and refused to let Foundation missionaries into their borders. Seldon\'s own recording stated that a major reason religious/spiritual sway would eventually lose influence was due to a growing sense of regionalism/nationalism among the barbarian kingdoms, in which the prior rule of the Galactic Empire was beyond living memory (in contrast, Anacreon\'s population was willing to revolt against its leaders only eighty years after independence). By this point, however, the Foundation would become enough of an economic power (now ruling the territory of the Four Kingdoms and expanding beyond them), that it could wield this as a non-violent weapon. Through trade alone, barbarian kingdoms would become dependent on Foundation technology, and then could be blockaded into submission without firing a shot. This passed as predicted, using an economic blockade to defeat the Republic of Korell. 4. Foundation and Empire – Two centuries into the Plan, the Foundation\'s growing trade hegemony in the Periphery would grow large enough that it would attract the direct attention of the Galactic Empire – mighty even in decay. While by that point the Empire only retained control over the inner third of the galaxy, these interior provinces had always been their core powerbase, controlling three-quarters of the galaxy\'s wealth and population (to the point that many in the Empire still didn\'t even notice it was in a decline). This happened as predicted: the last great general of the Empire, Bel Riose, serving its last great emperor, Cleon II, launched a campaign to conquer the Foundation. This time there was no masterstroke that the Foundation needed to win other than sheer tenacity, as the Empire was doomed to fail: a weak general was no threat to them, while a strong general under a weak emperor would rather conquer the centers of imperial power than the Foundation at its fringe. The only scenario that would result in an attack was a strong general under a strong emperor, but inherently, that emperor would see the general\'s growing conquests as a threat and eventually remove him – Cleon II ultimately had Bel Riose arrested on false charges of treason, after which the Empire experienced numerous civil wars and its rate of decline drastically increased. The strong general and emperor could never be the same person, because if the emperor went to conquer the fringes in person, usurpers would rise up in the central provinces. 5. Independent Traders – Three centuries into the Plan, the Foundation\'s sphere of influence would expand enough that Terminus was no longer the only center of economic power. The "Merchant Princes" on its border worlds, selling technology to barbarian kingdoms, would become powerful in their own right. Meanwhile, the central power of the Mayors of Terminus would grow increasingly corrupt, as wealth became concentrated. The independent traders would revolt against the central authority of the Mayor of Terminus, and although they would ultimately lose, the civil war would nonetheless result in key social and political reforms that would undo the corruption that instigated the crisis. In many ways the Foundation would experience the same problems (corruption and over-centralisation) that led to the decline of the Empire, although it would become stronger for doing so. The conditions for this Crisis to occur happened as predicted – the Mayor became a hereditary office, inherited by the incompetent descendant of once-competent predecessors, and the consortium of Independent Traders began talks where they mentioned rebellion. The crisis did not pass as predicted, the first of Seldon\'s Crises to fail to occur (with incredible accuracy) when predicted. Indeed, a hologram of Seldon appeared and discussed the Crisis, and how it would\'ve been solved, before a large audience that was occupied by a different crisis. Seldon\'s Plan was totally upset by the unpredicted appearance of the Mule, a mutant with the telepathic powers to control people\'s minds – \'mentalic\' powers. The Mule conquered the Foundation, and the Independent Trader worlds, and swept aside the last remnants of the Galactic Empire. The Mule, however, was eventually defeated by the Second Foundation, which was also focused on developing mentalic powers in order to guide Seldon\'s Plan with a firm hand, ensuring that either important events occur as predicted, or that the consequences of those events are managed such that the original event might as well have passed as predicted. With the Mule defeated, The Second Foundation then essentially "fakes its own death", convincing the resurgent First Foundation that the Second Foundation had existed but was now destroyed, to fulfill the tenet of psychohistory that the target population must not be aware they are being influenced, lest it alter their behaviors. Knowing that they were being influenced would be an additional (unmanaged) influence, i.e. during the final conflict against the warlord of Kalgan, the First Foundation was notably overconfident of victory because of the widespread belief that the Second Foundation would prevent them from ever losing. 6. This Seldon Crisis was not described. 7. This Seldon Crisis was not described. 8. Relocating the Capital – after 500 years, the people of Foundation would be in a position to consider moving their capital from Terminus, safe at the edge of the Galaxy, to a point much closer to the centre. While this debate did occur, this Crisis was not, as the others had been, a focal point for the narrative, and is given in less detail. The debate is ostensibly about moving the capital for economic purposes but, five centuries after the creation of the Foundation, halfway through the 1,000 year long "Great Interregnum", the Foundation, now known as the Foundation Federation, is now in a position of great power. Therefore, there is an underlying debate about obeying Seldon\'s Plan (which predicted the capital would remain on Terminus, with 87.2% probability, and the Second Galactic Empire was still 500 years away) or following a different path – they directly controlled one third of the galaxy, spread out from Terminus at the edge. They had faced no other major galactic rivals since the defeat of the First Galactic Empire (under Riose), with the greatest threat in that time being internal enemies that could form if it expanded too recklessly. The Foundation\'s control over so much territory led to a push to move the capital closer to the center. Ultimately this was rejected and the capital remained on Terminus, as Seldon predicted. Moving the capital closer to the center of their own territories, and thus the galaxy as a whole, would only embolden the Foundation to consider beginning campaigns into the territory of the powerful Interior provinces that once formed the core of the Galactic Empire, which would carry significant risk. To ensure a stable absorption, the Foundation could only accumulate these territories gradually over the next five centuries. 9. This Seldon Crisis was not described. Following events occurring in Foundation\'s Edge, there is a high likelihood neither the ninth or tenth Seldon Crisis occurred. Alternatively, given that Seldon was aware of Olivaw\'s plan for Galaxia, it is possible that the final two crises were actually dealing with it, or, with the inherent limits of psychohistory (i.e. war with extra-galactic aliens or transhumans). 10. This Seldon Crisis was not described. 1,000 years after the creation of the Foundation, having survived 10 Seldon Crises, Seldon\'s Plan predicted that it would control and unify the entire galaxy, forming a Second Galactic Empire. According to the Second Foundation in Foundation\'s Edge, who had maintained Seldon\'s original plan with revisions and corrective actions where necessary, the specific goal for this Second Empire was to make it a "Federated Empire" – with more power shared with the provinces so that the central government wouldn\'t become corrupt and decline as Trantor once had. On September 25, 1987, Asimov gave an interview to Terry Gross on her National Public Radio program, Fresh Air. In it, Gross asked him about psychohistory: Gross: "What did you have in mind when you coined the term and the concept?" Asimov on psychohistory Asimov: "Well, I wanted to write a short story about the fall of the Galactic Empire. I had just finished reading the Decline and Fall of the Roman Empire [for] the second time, and I thought I might as well adapt it on a much larger scale to the Galactic Empire and get a story out of it. And my editor John Campbell was much taken with the idea, and said he didn\'t want it wasted on a short story. He wanted an open-ended series so it lasts forever, perhaps. And so I started doing that. In order to keep the story going from story to story, I was essentially writing future history, and I had to make it sufficiently different from modern history to give it that science fictional touch. And so I assumed that the time would come when there would be a science in which things could be predicted on a probabilistic or statistical basis." Gross: "Do you think that would be good if there really was such a science?" Asimov: "Well, I can\'t help but think it would be good, except that in my stories, I always have opposing views. In other words, people argue all possible... all possible... ways of looking at psychohistory and deciding whether it is good or bad. So you can\'t really tell. I happen to feel sort of on the optimistic side. I think if we can somehow get across some of the problems that face us now, humanity has a glorious future, and that if we could use the tenets of psychohistory to guide ourselves we might avoid a great many troubles. But on the other hand, it might create troubles. It\'s impossible to tell in advance." In Gold: The Final Science Fiction Collection (which was published after his death) he writes about the origins of psychohistory: "Psychohistory" is one of the three words (that I know of) that I get early-use credit for in The Oxford English Dictionary. The other two, for the record, are "positronic" and "robotics". ... In the case of "psychohistory", however, I suspected that the word was not in common use, and might even never have been used before. (Actually, the O.E.D. cites one example of its use as early as 1934.) I first used it in my story, "Foundation", which appeared in the May 1942 issue of Astounding Science Fiction. ... So I suggested we add the fact that a mathematical treatment existed whereby the future could be predicted in a statistical fashion, and I called it "psychohistory". Actually, it was a poor word and did not represent what I truly meant. I should have called it "psychosociology" (a word which the O.E.D. lists as having first been used in 1928). However, I was so intent on history, thanks to Gibbon, that I could think of nothing but psychohistory. I modeled my concept of psychohistory on the kinetic theory of gases... The molecules making up gases moved in an absolutely random fashion in any direction in three dimensions and in a wide range of speeds. Nevertheless, one could fairly describe what those motions would be on the average and work out the gas laws from those average motions with an enormous degree of precision. In other words, although one couldn\'t possibly predict what a single molecule would do, one could accurately predict what umptillions of them would do. So I applied that notion to human beings. Each individual human being might have "free will", but a huge mob of them should behave with some sort of predictability, and the analysis of "mob behavior" was my psychohistory. There were two conditions that I had to set up in order to make it work, and they were not chosen carelessly. I picked them in order to make psychohistory more like kinetic theory. First, I had to deal with a large number of human beings, as kinetic theory worked with a large number of molecules. Neither would work for small numbers. It is for that reason that I had the Galactic Empire consist of twenty-five million worlds, each with an average population of four billion. That meant a total human population of one hundred quadrillion. ... Second, I had to retain the "randomness" factor. I couldn\'t expect human beings to behave as randomly as molecules, but they might approach such behavior if they had no idea as to what was expected of them. ... Much later in the game, I thought of a third condition that I didn\'t think of earlier simply because I had taken it so completely for granted. The kinetic theory assumes that gases are made up of nothing but molecules, and psychohistory will only work if the hosts of intelligence are made up of nothing but human beings. In other words, the presence of aliens with non-human intelligence might well bollix the works. This situation may actually develop in future books of the Foundation series, but so far I have stayed clear of non-human intelligences in my Galactic Empire ... At the 67th science-fiction world convention in Montreal, Paul Krugman, the Nobel laureate in Economics, mentioned Hari Seldon, a central character in Foundation who was a psychohistorian, as his inspiration to study Economics since it is the closest thing to Psychohistory. The 3 February 2017 issue of Science has a special section "Prediction and Its Limits". This section has articles on many mathematical techniques of predicting human behavior, and explicitly compares them to Asimov\'s psychohistory. Some literary critics have described Asimov\'s psychohistory as a reformulation of Karl Marx\'s theory of history (historical materialism), though Asimov denied any direct influence. Arguably, Asimov\'s psychohistory departs significantly from Marx\'s general theory of history based on modes of production (as distinct from Marx\'s model of the capitalist economy, where "natural laws" work themselves out with "iron necessity") in that psychohistory is predictive (if only in the sense of involving precisely stated probabilities), and in that psychohistory is extrapolated from individual psychology and even from physics. Psychohistory also has echoes of modernization theory and of work in the social sciences that by the 1960s would lead to attempts at large-scale social prediction and control such as Project Camel';

function divider() {
    console.log('==================================================');
    console.log('==================================================');
    console.log('==================================================');
}

(async () => {
    const content = {
        public: {
            '@context': ['https://schema.org'],
            '@id': 'uuid:123455553332221',
            company: 'OT',
            user: {
                '@id': 'uuid:user:1',
            },
            city: {
                '@id': 'uuid:belgrade',
            },
        },
        private: {
            '@context': ['https://schema.org'],
            '@graph': [
                {
                    '@id': 'uuid:user:1',
                    name: 'Adam',
                    lastname: 'Smith',
                },
                {
                    '@id': 'uuid:belgr4234234ade',
                    title: 'Belgrade',
                    postCode: '11000',
                },
            ],
        },
    };
    content.public.text = '';
    // i = 21 0.5134754180908203 MB
    // i = 41 1.0021381378173828
    // i = 82 2.003896713256836
    // i = 205 5.009172439575195
    // i = 307 7.501352310180664
    // i = 405 9.89579963684082
    // i = 409 9.993532180786133
    // i = 410 10.017965316772461
    for (let i = 0; i < 410; i++) {
        content.public.text += psychohistory;
    }
    divider();

    // const nodeInfo = await DkgClient.node.info();
    // console.log('======================== NODE INFO RECEIVED');
    // console.log(nodeInfo);

    // divider();

    // const assertions = await DkgClient.assertion.formatGraph(content);
    // console.log('======================== ASSERTIONS FORMATTED');
    // console.log(JSON.stringify(assertions));

    // divider();

    // const publicAssertionId = await DkgClient.assertion.getPublicAssertionId(content);
    // console.log('======================== PUBLIC ASSERTION ID (MERKLE ROOT) CALCULATED');
    // console.log(publicAssertionId);

    // divider();

    const publicAssertionSize = await DkgClient.assertion.getSizeInBytes(content);
    console.log('======================== PUBLIC ASSERTION SIZE CALCULATED');
    console.log(publicAssertionSize);
    console.log('======================== PUBLIC ASSERTION SIZE CALCULATED IN MB');
    console.log(publicAssertionSize / 1048576);
    divider();
    return;
    const bidSuggestion = await DkgClient.network.getBidSuggestion(
        publicAssertionId,
        publicAssertionSize,
        { epochsNum: 2 },
    );
    console.log('======================== BID SUGGESTION CALCULATED');
    console.log(bidSuggestion);

    divider();

    const increaseAllowanceResult = await DkgClient.asset.increaseAllowance(bidSuggestion);
    console.log('======================== ALLOWANCE INCREASED');
    console.log(increaseAllowanceResult);

    divider();

    const decreaseAllowanceResult = await DkgClient.asset.decreaseAllowance(bidSuggestion);
    console.log('======================== ALLOWANCE DECREASED');
    console.log(decreaseAllowanceResult);

    divider();

    const setAllowanceResult = await DkgClient.asset.setAllowance(bidSuggestion);
    console.log('======================== ALLOWANCE SET');
    console.log(setAllowanceResult);

    divider();

    const createAssetResult = await DkgClient.asset.create(content, { epochsNum: 2 });
    console.log('======================== ASSET CREATED');
    console.log(createAssetResult);
    divider();
    return;
    const ownerResult = await DkgClient.asset.getOwner(createAssetResult.UAL);
    console.log('======================== GET ASSET OWNER');
    console.log(ownerResult);

    divider();

    const getAssetResult = await DkgClient.asset.get(createAssetResult.UAL);
    console.log('======================== ASSET RESOLVED');
    console.log(JSON.stringify(getAssetResult, null, 2));

    divider();

    const updateAssetResult = await DkgClient.asset.update(createAssetResult.UAL, {
        public: {
            '@context': ['https://schema.org'],
            '@id': 'uuid:1',
            company: 'TL',
            user: {
                '@id': 'uuid:user:2',
            },
            city: {
                '@id': 'uuid:Nis',
            },
        },
        private: {
            '@context': ['https://schema.org'],
            '@graph': [
                {
                    '@id': 'uuid:user:1',
                    name: 'Adam',
                    lastname: 'Smith',
                    identifier: `${Math.floor(Math.random() * 1e10)}`,
                },
            ],
        },
    });
    console.log('======================== ASSET UPDATED');
    console.log(updateAssetResult);

    divider();

    const getLatestAssetResult = await DkgClient.asset.get(createAssetResult.UAL);
    console.log('======================== ASSET LATEST  RESOLVED');
    console.log(JSON.stringify(getLatestAssetResult, null, 2));

    divider();

    let getLatestFinalizedAssetResult = await DkgClient.asset.get(createAssetResult.UAL, {
        state: 'LATEST_FINALIZED',
    });
    console.log('======================== ASSET LATEST FINALIZED RESOLVED');
    console.log(JSON.stringify(getLatestFinalizedAssetResult, null, 2));

    divider();

    await DkgClient.asset.waitFinalization(createAssetResult.UAL);
    console.log('======================== FINALIZATION COMPLETED');

    divider();

    getLatestFinalizedAssetResult = await DkgClient.asset.get(createAssetResult.UAL, {
        state: 'LATEST_FINALIZED',
    });
    console.log('======================== ASSET LATEST FINALIZED RESOLVED');
    console.log(JSON.stringify(getLatestFinalizedAssetResult, null, 2));

    divider();

    const getFirstStateByIndex = await DkgClient.asset.get(createAssetResult.UAL, {
        state: 0,
    });
    console.log('======================== ASSET FIRST STATE (GET BY STATE INDEX) RESOLVED');
    console.log(JSON.stringify(getFirstStateByIndex, null, 2));

    divider();

    const getSecondStateByIndex = await DkgClient.asset.get(createAssetResult.UAL, {
        state: 1,
    });
    console.log('======================== ASSET SECOND STATE (GET BY STATE INDEX) RESOLVED');
    console.log(JSON.stringify(getSecondStateByIndex, null, 2));

    divider();

    const getFirstStateByHash = await DkgClient.asset.get(createAssetResult.UAL, {
        state: createAssetResult.publicAssertionId,
    });
    console.log('======================== ASSET FIRST STATE (GET BY STATE HASH) RESOLVED');
    console.log(JSON.stringify(getFirstStateByHash, null, 2));

    divider();

    const getSecondStateByHash = await DkgClient.asset.get(createAssetResult.UAL, {
        state: updateAssetResult.publicAssertionId,
    });
    console.log('======================== ASSET SECOND STATE (GET BY STATE HASH) RESOLVED');
    console.log(JSON.stringify(getSecondStateByHash, null, 2));

    let queryResult = await DkgClient.graph.query(
        'construct { ?s ?p ?o } where { ?s ?p ?o . <uuid:1> ?p ?o }',
        'CONSTRUCT',
    );
    console.log('======================== QUERY LOCAL CURRENT RESULT');
    console.log(
        JSON.stringify(
            await jsonld.fromRDF(queryResult.data, {
                algorithm: 'URDNA2015',
                format: 'application/n-quads',
            }),
            null,
            2,
        ),
    );

    divider();

    queryResult = await DkgClient.graph.query(
        'construct { ?s ?p ?o } where { ?s ?p ?o . <uuid:user:1> ?p ?o }',
        'CONSTRUCT',
        { graphState: 'HISTORICAL', graphLocation: 'LOCAL_KG' },
    );
    console.log('======================== QUERY LOCAL HISTORY RESULT');
    console.log(
        JSON.stringify(
            await jsonld.fromRDF(queryResult.data, {
                algorithm: 'URDNA2015',
                format: 'application/n-quads',
            }),
            null,
            2,
        ),
    );

    divider();

    const newOwner = '0x2ACa90078563133db78085F66e6B8Cf5531623Ad';
    const transferResult = await DkgClient.asset.transfer(createAssetResult.UAL, newOwner);
    console.log(`======================== ASSET TRANSFERRED TO ${newOwner}`);
    console.log(transferResult);

    divider();
})();

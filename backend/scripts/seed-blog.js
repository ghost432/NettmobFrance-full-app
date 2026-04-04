import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import https from 'https';
import db from '../config/database.js';

const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});

const articles = {
    // ... same articles ...
    "autoEntrepreneurArticles": [
        {
            "title": "Saturation du marché et difficultés pour décrocher des missions en 2026",
            "date": "25 février 2026",
            "excerpt": "En 2026, l’un des défis les plus persistants pour les auto-entrepreneurs en France n’est pas seulement économique ou administratif : il est humain, stratégique et numérique.",
            "image": "https://www.nettmobfrance.fr/wp-content/uploads/2026/02/hausse-des-cotisations-pour-les-auto-entrepreneurs-en-2026_1920x1080-1.jpeg",
            "content": "Le régime de l’auto-entrepreneur attire encore beaucoup de candidats grâce à sa simplicité administrative, des cotisations sociales allégées et la possibilité de se lancer sans apport de départ. Cependant, cette popularité a un revers : le marché est devenu extrêmement saturé dans de nombreux secteurs. La France compte aujourd’hui plusieurs millions d’auto-entrepreneurs actifs. Cette masse de travailleurs indépendants se retrouve face à une concurrence féroce, notamment dans les domaines les plus accessibles : services aux particuliers, logistique, nettoyage, hôtellerie, services informatiques et métiers du digital. La conséquence directe de cette saturation est une pression importante sur les prix. Beaucoup d’auto-entrepreneurs sont contraints de baisser leurs tarifs simplement pour obtenir des missions."
        },
        {
            "title": "Missions rares, concurrence rude : pourquoi tant d’auto-entrepreneurs peinent à vivre de leur activité en 2026",
            "date": "30 janvier 2026",
            "excerpt": "De plus en plus d’auto-entrepreneurs, mais de moins en moins de missions stables et correctement rémunérées.",
            "image": "https://www.nettmobfrance.fr/wp-content/uploads/2026/01/hausse-des-cotisations-pour-les-auto-entrepreneurs-en-2026_1920x1080.jpeg",
            "content": "Le statut d’auto-entrepreneur séduit par sa flexibilité, mais en 2026, la réalité est plus complexe. Une explosion du nombre d’indépendants a entraîné une saturation du marché. Les missions deviennent de plus en plus difficiles à obtenir, avec moins d’offres sérieuses et des délais d’attente prolongés. La concurrence intense fragilise ce modèle déjà précaire. Beaucoup de professionnels se retrouvent à devoir accepter des conditions de travail dégradées pour maintenir un minimum de revenus."
        },
        {
            "title": "Auto-entrepreneurs en France en 2026 : entre surcharge de travail et absence de reconnaissance",
            "date": "30 janvier 2026",
            "excerpt": "En 2026, le nombre d’auto-entrepreneurs en France continue d’augmenter. Mais derrière cette dynamique se cache une surcharge de travail constante et un manque de reconnaissance.",
            "image": "https://www.nettmobfrance.fr/wp-content/uploads/2026/01/auto-entrepreneur-charge-nouvelle-1.avif",
            "content": "Le travail d’un auto-entrepreneur ne se limite pas à l’exécution des missions. Il comprend aussi la prospection quotidienne, la gestion administrative (factures, déclarations, relances), la négociation avec les clients et la recherche permanente de nouvelles opportunités. Ces tâches invisibles occupent une part importante du temps, sans être rémunérées. En 2026, beaucoup d'auto-entrepreneurs font face à des journées sans fin, sans réelle frontière entre vie privée et professionnelle, pour une rémunération qui ne suit pas toujours l'investissement fourni."
        },
        {
            "title": "Auto-entrepreneurs en France : trouver des missions devient un véritable défi",
            "date": "4 mars 2026",
            "excerpt": "En France, le nombre d’auto-entrepreneurs continue d’augmenter. Mais trouver des missions régulières devient de plus en plus compliqué.",
            "image": "https://www.nettmobfrance.fr/wp-content/uploads/2026/03/jeune-femme-travaillant-sur-la-terrasse-du-cafe-768x512-1.jpg",
            "content": "Depuis 2024, le marché du travail français connaît un ralentissement. Les entreprises recrutent moins et les offres d’emploi diminuent. Pour les auto-entrepreneurs, cela signifie moins de missions disponibles, plus de concurrence et des négociations difficiles. Beaucoup passent désormais plus de temps à prospecter qu'à travailler. L'isolement est également un facteur pesant, car contrairement aux salariés, ils doivent tout gérer seuls."
        }
    ],
    "enterpriseArticles": [
        {
            "title": "Pénurie de profils fiables : pourquoi les entreprises françaises peinent à recruter des auto-entrepreneurs en 2026",
            "date": "31 janvier 2026",
            "excerpt": "En 2026, les entreprises françaises font face à une contradiction : jamais le nombre d’auto-entrepreneurs n’a été aussi élevé, et pourtant jamais il n’a été aussi difficile de recruter des profils réellement fiables.",
            "image": "https://entreprise.nettmobfrance.fr/wp-content/uploads/2026/01/Ils-vont-payer-la-TVA-des-37500-ce-que-cache-la-reforme-choc-pour-les-auto-entrepreneurs-en-2026-3.jpg",
            "content": "Le statut d’auto-entrepreneur attire chaque année des milliers de personnes en quête d’indépendance. Cependant, beaucoup se lancent sans réelle expérience terrain ou sous-estiment les exigences professionnelles. Résultat : une offre abondante mais très inégale, difficile à exploiter pour les entreprises. Dans de nombreux secteurs — logistique entrepôt, grande distribution, hôtellerie, nettoyage, événementiel ou services — cette pénurie de fiabilité devient un frein majeur à la croissance et à la stabilité des entreprises françaises."
        },
        {
            "title": "Entre méfiance et perte de temps : pourquoi les entreprises françaises doutent de plus en plus des plateformes classiques",
            "date": "31 janvier 2026",
            "excerpt": "Au cours des dernières années, les plateformes de mise en relation se sont multipliées. En 2026, de nombreuses entreprises ne font plus confiance aux plateformes classiques.",
            "image": "https://entreprise.nettmobfrance.fr/wp-content/uploads/2026/01/Ils-vont-payer-la-TVA-des-37500-ce-que-cache-la-reforme-choc-pour-les-auto-entrepreneurs-en-2026-2.jpg",
            "content": "Le marché est aujourd’hui saturé de plateformes qui proposent des milliers de profils sans réel contrôle à l’entrée. Pour les entreprises, cela signifie passer des heures à trier des CV, à passer des appels qui n’aboutissent pas et à gérer des prestataires qui ne correspondent pas aux besoins réels. La perte de temps devient insupportable pour les TPE et PME qui ont besoin de solutions immédiates et fiables. Le manque de vérification des compétences et du sérieux des auto-entrepreneurs sur ces plateformes classiques nuit gravement à la qualité des missions."
        },
        {
            "title": "Urgences opérationnelles et désistements de dernière minute : un risque permanent pour les entreprises françaises",
            "date": "31 janvier 2026",
            "excerpt": "En 2026, les entreprises françaises évoluent dans un contexte de plus en plus tendu : délais serrés, exigences clients élevées, flux de travail en continu.",
            "image": "https://entreprise.nettmobfrance.fr/wp-content/uploads/2026/01/iStock-2210168720.jpg",
            "content": "En 2026, les entreprises françaises évoluent dans un contexte de plus en plus tendu : délais serrés, exigences clients élevées, flux de travail en continu. Dans ce cadre, les urgences opérationnelles font partie du quotidien. Pourtant, un phénomène fragilise gravement leur organisation : les désistements de dernière minute des auto-entrepreneurs, devenus fréquents et difficilement anticipables. De nombreux secteurs comme la logistique, la grande distribution, le nettoyage industriel ou l'hôtellerie sont particulièrement vulnérables à ces imprévus qui peuvent paralyser toute une chaîne d'activité."
        },
        {
            "title": "Recrutement difficile : les TPE et PME peinent à trouver des profils qualifiés — auto-entrepreneurs inclus",
            "date": "25 février 2026",
            "excerpt": "En France en 2025-2026, les très petites entreprises (TPE) et les petites et moyennes entreprises (PME) continuent de se heurter à une difficulté récurrente : trouver des profils qualifiés.",
            "image": "https://entreprise.nettmobfrance.fr/wp-content/uploads/2026/02/AdobeStock_252506568-scaled-1.jpeg",
            "content": "Une enquête de conjoncture menée auprès de dirigeants de TPE/PME indique que près de 9 entreprises sur 10 déclarent rencontrer des difficultés pour recruter le bon profil. Cette difficulté ne touche pas seulement les salariés classiques ; elle s’étend aussi aux profils externes comme les auto-entrepreneurs, surtout quand ces derniers doivent être hautement spécialisés ou immédiatement opérationnels. Le manque général de profils qualifiés disponibles est le premier frein cité par les dirigeants."
        }
    ]
};

const downloadImage = async (url, filename) => {
    const dir = 'uploads/blog';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, filename);
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        const buffer = await response.buffer();
        fs.writeFileSync(filePath, buffer);
        return `/uploads/blog/${filename}`;
    } catch (error) {
        console.error(`Error downloading ${url}:`, error.message);
        return null;
    }
};

const seed = async () => {
    console.log('🌱 Starting blog seeding...');

    try {
        // Clear existing blog posts (optional, but good for testing)
        // await db.query('DELETE FROM blog_posts');
        // console.log('🗑️ Existing posts cleared');

        // Seed Auto-Entrepreneur articles
        for (const [index, article] of articles.autoEntrepreneurArticles.entries()) {
            const ext = path.extname(article.image.split('?')[0]) || '.jpg';
            const filename = `auto-blog-${index}-${Date.now()}${ext}`;
            const localImageUrl = await downloadImage(article.image, filename);

            await db.query(
                'INSERT INTO blog_posts (title, type, excerpt, content, image_url) VALUES (?, ?, ?, ?, ?)',
                [article.title, 'auto-entrepreneur', article.excerpt, article.content, localImageUrl]
            );
            console.log(`✅ Seeded: ${article.title}`);
        }

        // Seed Enterprise articles
        for (const [index, article] of articles.enterpriseArticles.entries()) {
            const ext = path.extname(article.image.split('?')[0]) || '.jpg';
            const filename = `ent-blog-${index}-${Date.now()}${ext}`;
            const localImageUrl = await downloadImage(article.image, filename);

            await db.query(
                'INSERT INTO blog_posts (title, type, excerpt, content, image_url) VALUES (?, ?, ?, ?, ?)',
                [article.title, 'enterprise', article.excerpt, article.content, localImageUrl]
            );
            console.log(`✅ Seeded: ${article.title}`);
        }

        console.log('🏁 Seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seed();

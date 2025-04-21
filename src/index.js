import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { type } from "os";
import swaggerUi from "swagger-ui-express"
import YAML from "yamljs";

dotenv.config();

// Lire le fichier JSON
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pokemonsList = JSON.parse(
	fs.readFileSync(path.join(__dirname, "./data/pokemons.json"), "utf8"),
);

const pokemonTypes = [
	"fire",
	"water",
	"grass",
	"electric",
	"ice",
	"fighting",
	"poison",
	"ground",
	"flying",
	"psychic",
	"bug",
	"rock",
	"ghost",
	"dragon",
	"dark",
	"steel",
	"fairy",
];

const swaggerDocument = YAML.load(path.join(__dirname, '../docs/swagger.yaml'));

const app = express();
const PORT = 3000;

// Middleware pour CORS
app.use(cors());

// Middleware pour parser le JSON
app.use(express.json());

// Middleware pour servir des fichiers statiques
// 'app.use' est utilisé pour ajouter un middleware à notre application Express
// '/assets' est le chemin virtuel où les fichiers seront accessibles
// 'express.static' est un middleware qui sert des fichiers statiques
// 'path.join(__dirname, '../assets')' construit le chemin absolu vers le dossier 'assets'
app.use("/assets", express.static(path.join(__dirname, "../assets")));

// Route GET de base
app.get("/api/pokemons", (req, res) => {
	res.status(200).send({
		types: pokemonTypes,
		pokemons: pokemonsList,
	});
});

// Route GET pour récupérer un Pokémon par son ID
app.get("/api/pokemons/:id", (req, res) => {
	const id = parseInt(req.params.id);
	const pokemon = pokemonsList.find((p) => p?.id === id);

	if (!pokemon) {
		return res.status(404).send({ error: "Pokémon non trouvé" });
	}

	res.status(200).send({ pokemon: pokemon });
});

// Route POST pour créer un Pokémon
app.post("/api/pokemons", (req, res) => {
	const pokemonId = pokemonsList.length + 1;
	const pokemon = {
		id: pokemonId,
		name: req.body.name,
		type: req.body.type,
		base: req.body.base,
		image: req.body.image,
	};
	checkInfos(pokemon, res);
	try {
		pokemonsList.push(pokemon);
		fs.writeFileSync(
			path.join(__dirname, "./data/pokemons.json"),
			JSON.stringify(pokemonsList),
		);
	} catch (err) {
		return res.status(500).send(`erreur : ${err}`);
	}
	res.status(200).send({ message: "Pokemon bien ajouté" });
});

// Route UPDATE pour modifeier un Pokémon existant par son ID
app.put("/api/pokemons/:id", (req, res) => {
	const id = parseInt(req.params.id);

	if (id > pokemonsList.length) {
		return res.status(404).send({ error: "Pokémon non trouvé" });
	}

	pokemonsList.map((p, idx) => {
		if (p.id === id) {
			const modifiedPokemon = {
				id: p.id,
				name: req.body.name ?? p.name,
				type: req.body.type ?? p.type,
				base: req.body.base ?? p.base,
				image: req.body.image ?? p.image,
			};
			checkInfos(modifiedPokemon, res);
			pokemonsList[idx] = modifiedPokemon;
			fs.writeFileSync(
				path.join(__dirname, "./data/pokemons.json"),
				JSON.stringify(pokemonsList),
			);
		}
	});

	res.status(200).send(pokemonsList[id - 1]);
});

app.delete("/api/pokemons/:id", (req, res) => {
	const id = parseInt(req.params.id);
	const pokemonName = pokemonsList[id - 1]?.name?.french;
	delete pokemonsList[id - 1];
	fs.writeFileSync(
		path.join(__dirname, "./data/pokemons.json"),
		JSON.stringify(pokemonsList),
	);
	res
		.status(200)
		.send({ message: `Le Pokémon "${pokemonName}" a bien été supprimé` });
});

app.get("/", (req, res) => {
	res.send("bienvenue sur l'API Pokémon");
});

function checkInfos(pokemon, res) {
	if (
		pokemon.name?.english === undefined ||
		pokemon.name?.japanese === undefined ||
		pokemon.name?.chinese === undefined ||
		pokemon.name?.french === undefined
	) {
		return res
			.status(400)
			.send(
				'Valeur de la clé "nom" incorrect, assurez vous de renseigner les clés "english", "japanese", "chinese", et "french"',
			);
	}
	if (typeof pokemon.type !== "object") {
		return res
			.status(400)
			.send(
				'Valeur de la clé "type" incorrect, renseignez un array de string représentant les types',
			);
	}
	pokemon.type?.map((t) => {
		let isValid = false;
		pokemonTypes.map((pt) => {
			if (pt === t) {
				isValid = true;
			}
		});
		if (!isValid) {
			return res.status(400).send({
				message: `le type "${t}" n'existe pas, les types acceptés sont : ${pokemonTypes}`,
			});
		}
	});
	if (
		pokemon.base?.HP === undefined ||
		pokemon.base?.Attack === undefined ||
		pokemon.base?.Defense === undefined ||
		pokemon.base?.Speed === undefined
	) {
		return res
			.status(400)
			.send(
				'Valeur de la clé "base" incorrect, renseignez une valeur pour les clés suivantes : "HP", "Attack", "Defense", "Sp. Attack", "Sp. Defense",  et "Speed"',
			);
	}
	if (pokemon?.image === undefined || typeof pokemon.image !== "string") {
		return res
			.status(400)
			.send(
				'Valeur de la clé "image" incorrect, renseignez le chemin de l\'image',
			);
	}
}

// Doc swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Démarrage du serveur
app.listen(PORT, () => {
	console.log(`Serveur démarré sur http://localhost:${PORT}`);
});

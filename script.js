
//////////////////////////////////////////////////////////////////////////////////////
// Traduction des types
const typeTraductions = {
    normal: "Normal",
    fire: "Feu",
    water: "Eau",
    grass: "Plante",
    electric: "Électrik",
    ice: "Glace",
    fighting: "Combat",
    poison: "Poison",
    ground: "Sol",
    flying: "Vol",
    psychic: "Psy",
    bug: "Insecte",
    rock: "Roche",
    ghost: "Spectre",
    dark: "Ténèbres",
    dragon: "Dragon",
    steel: "Acier",
    fairy: "Fée"
};

//////////////////////////////////////////////////////////////////////////////////////
// Chargement des noms français
let nomsFrVersAnglais = {};

fetch("https://pokeapi.co/api/v2/pokemon-species?limit=3000")
    .then(r => r.json())
    .then(data => chargerNomsFrancais(data.results));

function chargerNomsFrancais(resultats) {
    Promise.all(resultats.map(p => fetch(p.url).then(r => r.json())))
        .then(especes => {
            especes.forEach(e => {
                const fr = e.names.find(n => n.language.name === "fr");
                if (fr) {
                    nomsFrVersAnglais[fr.name.toLowerCase()] = {
                        name: e.name,
                        id: e.id
                    };
                }
            });
        });
}

/////////////////////////////////////////////////////////////////////////////////////////
// Génération du HTML pour la liste 20 par 20
let offset = 0;
const limit = 20;

document.querySelector("#loadMoreBtn").addEventListener("click", afficherPokemonParLot);

function afficherPokemonParLot() {
    fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`)
        .then(r => r.json())
        .then(data => {
            offset += limit;
            afficherCartesPokemon(data.results);
        });
}
function afficherCartesPokemon(liste) {
    const section = document.querySelector("#gallerySection");

    Promise.all(
        liste.map(p => fetch(p.url).then(r => r.json())))
        .then(details => {
            details.forEach(pokemon => {
                const carte = document.createElement("div");
                carte.className = "pokemon-card";

                const nomFr = Object.entries(nomsFrVersAnglais).find(([k, v]) => v.name === pokemon.name)?.[0] || pokemon.name;

                const typesHtml = pokemon.types.map(t => {
                    const typeEn = t.type.name;
                    const typeFr = typeTraductions[typeEn] || typeEn;
                    return `<span class="type-badge type-${typeEn}">${typeFr}</span>`;
                }).join("");

                carte.innerHTML = `
                <p>ID : ${pokemon.id}</p>
                <p><strong>${nomFr}</strong></p>
                <img src="${pokemon.sprites.other.showdown.front_default}" alt="${nomFr}">
                
                <div class="types-container">${typesHtml}</div>
            `;

                carte.addEventListener("click", () => {
                    document.querySelector("#searchInput").value = nomFr;
                    rechercherPokemon();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                });

                section.appendChild(carte);
            });
        });
}


//////////////////////////////////////////////////////////////////////////////////////
// Détermine le nom anglais ou ID
function getNomPokemon(entree) {
    if (/^\d+$/.test(entree)) {
        return entree;
    }
    const info = nomsFrVersAnglais[entree];
    if (info) {
        return info.name;
    }
    return null;
}

///////////////////////////////////////////////////////////////////////////////////////
// Lance la recherche
function rechercherPokemon() {
    const input = document.querySelector("#searchInput").value.trim().toLowerCase();
    const nom = getNomPokemon(input);
    const result = document.querySelector("#result");
    result.innerHTML = "";
    if (!nom)

        return result.textContent = "Pokémon non trouvé (vérifie le nom français ou l'ID)";
    fetchInfosPokemon(nom, result);
}

///////////////////////////////////////////////////////////////////////////////////////
// Récupère les données du Pokémon
function fetchInfosPokemon(nom, zone) {
    fetch(`https://pokeapi.co/api/v2/pokemon/${nom}`)
        .then(r => r.json())
        .then(data => afficherInfosPokemon(data, zone))
        .catch(() => zone.textContent = "Pokémon non trouvé.");
}

// Affiche les infos du Pokémon
function afficherInfosPokemon(data, zone) {
    const img = creerImage(data);
    const id = creerTexte(`ID : ${data.id}`);
    const taille = creerTexte(`Taille : ${data.height / 10} m`);
    const poids = creerTexte(`Poids : ${data.weight / 10} kg`);
    const types = creerTypes(data.types);
    const stats = creerStats(data.stats);
    const boutonShiny = creerBoutonShiny(img, data);

    zone.append(img, boutonShiny, id, types, taille, poids, stats);
    fetchDescription(data.species.url, zone, data.name);
}

//////////////////////////////////////////////////////////////////////////////////////
// Génération des éléments HTML
function creerImage(data) {
    const img = document.createElement("img");
    img.alt = data.name;
    img.classList.add("pokemon-image");

    const id = data.id;

    const srcs = {
        normal: {
            static: data.sprites.other.home.front_default,
            gif: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${id}.gif`
        },
        shiny: {
            static: data.sprites.other.home.front_shiny,
            gif: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/shiny/${id}.gif`
        }
    };

    let isShiny = false;
    let isHover = false;

    function updateImage() {
        if (isHover) {
            img.src = isShiny ? srcs.shiny.gif : srcs.normal.gif;
        } else {
            img.src = isShiny ? srcs.shiny.static : srcs.normal.static;
        }
    }

    img.addEventListener("mouseenter", () => {
        isHover = true;
        img.classList.add("fade");
        setTimeout(() => {
            updateImage();
            img.classList.remove("fade");
        }, 150);
    });

    img.addEventListener("mouseleave", () => {
        isHover = false;
        img.classList.add("fade");
        setTimeout(() => {
            updateImage();
            img.classList.remove("fade");
        }, 150);
    });

    img.setShiny = (val) => {
        isShiny = val;
        updateImage();
    };


    updateImage();

    return img;
}

function creerTexte(texte) {
    const p = document.createElement("p");
    p.textContent = texte;

    return p;
}

function creerTypes(types) {
    const container = document.createElement("div");
    container.classList.add("types-container");
    types.forEach(t => {
        const span = document.createElement("span");
        const typeEn = t.type.name;
        span.textContent = typeTraductions[typeEn] || typeEn;
        span.className = `type-badge type-${typeEn}`;

        container.appendChild(span);
    });

    return container;
}

function creerStats(stats) {
    const ul = document.createElement("ul");
    ul.textContent = "Statistiques :";
    stats.forEach(stat => {
        const li = document.createElement("li");
        li.textContent = `${stat.stat.name} : ${stat.base_stat}`;

        ul.appendChild(li);
    });

    return ul;
}

function creerBoutonShiny(img, data) {
    const bouton = document.createElement("button");
    bouton.textContent = "Afficher shiny";
    bouton.classList.add("shiny-button");

    let shiny = false;
    bouton.addEventListener("click", () => {
        shiny = !shiny;
        img.setShiny(shiny);
        bouton.textContent = shiny ? "Afficher normal" : "Afficher shiny";
    });

    return bouton;
}


///////////////////////////////////////////////////////////////////////////////////////
// Récupère et affiche le nom et la description FR
function fetchDescription(url, zone, fallbackName) {
    fetch(url)
        .then(r => r.json())
        .then(espece => {
            const nomFr = espece.names.find(n => n.language.name === "fr")?.name || fallbackName;
            const desc = espece.flavor_text_entries.find(e => e.language.name === "fr");
            afficherNomEtDescription(nomFr, desc, zone);
        });
}

function afficherNomEtDescription(nom, desc, zone) {
    const h2 = document.createElement("h2");
    h2.textContent = nom;
    const p = document.createElement("p");
    p.textContent = desc ? `Description : ${desc.flavor_text.replace(/\n|\f/g, " ")}` : "";

    zone.insertBefore(h2, zone.firstChild);
    zone.appendChild(p);

}

/////////////////////////////////////////////////////////////////////////////////////////
// Événements
document.querySelector("#searchBtn").addEventListener("click", rechercherPokemon);
document.querySelector("#searchInput").addEventListener("keydown", e => {
    if (e.key === "Enter") rechercherPokemon();
});

///////////////////////////////////////////////////////////////////////////////////////
// Liste autocompletion
const input = document.querySelector("#searchInput");
const autocompleteList = document.querySelector("#autocompleteList");

input.addEventListener("input", () => {
    const value = input.value.trim().toLowerCase();
    autocompleteList.innerHTML = "";

    if (!value || !Object.keys(nomsFrVersAnglais).length) return;

    const suggestions = Object.entries(nomsFrVersAnglais)
        .filter(([nomFr]) => nomFr.startsWith(value))
        .slice(0, 5);

    suggestions.forEach(([nomFr, info]) => {
        const { id } = info;

        const item = document.createElement("div");
        item.className = "autocomplete-item";

        item.innerHTML = `
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${id}.gif" alt="${nomFr}">
            <span>${nomFr}</span>
        `;

        item.addEventListener("click", () => {
            input.value = nomFr;
            autocompleteList.innerHTML = "";
            rechercherPokemon();
        });

        autocompleteList.appendChild(item);
    });
});
/////////////////////////////////////////////////////////////////////////////////////

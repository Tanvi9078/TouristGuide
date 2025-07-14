const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

const USERS_FILE = path.join(__dirname, "users.json");
const CITIES_FILE = path.join(__dirname, "cities.json");

const loadUsers = () => {
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]");
  return JSON.parse(fs.readFileSync(USERS_FILE));
};

const saveUsers = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

const loadCities = () => {
  if (!fs.existsSync(CITIES_FILE)) fs.writeFileSync(CITIES_FILE, "[]");
  return JSON.parse(fs.readFileSync(CITIES_FILE));
};

const saveCities = (cities) => {
  fs.writeFileSync(CITIES_FILE, JSON.stringify(cities, null, 2));
};

app.post("/api/register", (req, res) => {
  const { name, email, password, role } = req.body;
  const users = loadUsers();
  const userExists = users.find(u => u.email === email);

  if (userExists) {
    return res.status(400).json({ message: "User already exists." });
  }

  users.push({ name, email, password, role });
  saveUsers(users);
  res.json({ message: "Registration successful!" });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const users = loadUsers();
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  res.json({ message: `Welcome back, ${user.name}!`, role: user.role });
});

// City CRUD
app.get("/api/cities", (req, res) => res.json(loadCities()));

app.post("/api/cities", (req, res) => {
  const cities = loadCities();
  const { name } = req.body;
  const id = Date.now();
  cities.push({ id, name, categories: { hotel: [], food: [], places: [] } });
  saveCities(cities);
  res.json({ message: "City added", id });
});

app.put("/api/cities/:id", (req, res) => {
  const cities = loadCities();
  const { id } = req.params;
  const { name } = req.body;
  const index = cities.findIndex(c => c.id == id);
  if (index !== -1) {
    cities[index].name = name;
    saveCities(cities);
    res.json({ message: "City updated" });
  } else {
    res.status(404).json({ message: "City not found" });
  }
});

app.delete("/api/cities/:id", (req, res) => {
  let cities = loadCities();
  const { id } = req.params;
  cities = cities.filter(c => c.id != id);
  saveCities(cities);
  res.json({ message: "City deleted" });
});

// Add category item to a city
app.post("/api/cities/:id/categories/:type", (req, res) => {
  const cities = loadCities();
  const { id, type } = req.params;
  const { name } = req.body;

  const city = cities.find(c => c.id == id);
  if (!city) return res.status(404).json({ message: "City not found" });

  if (!city.categories[type]) city.categories[type] = [];
  city.categories[type].push(name);
  saveCities(cities);

  res.json({ message: `${type} added to ${city.name}` });
});

// Get category items for a city
app.get("/api/cities/:id/categories/:type", (req, res) => {
  const cities = loadCities();
  const { id, type } = req.params;

  const city = cities.find(c => c.id == id);
  if (!city) return res.status(404).json({ message: "City not found" });

  res.json(city.categories[type] || []);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

import { Hono } from "hono";
import { serve } from "@hono/node-server";
import ejs from "ejs";

const app = new Hono();

const birds = [
  {
    id: "1",
    name: "Sýkora koňadra",
    latinName: "Parus major",
    order: "Pěvci",
    family: "Sýkorovití",
    location: { lat: 50.0755, lng: 14.4378 },
    date: "2024-03-15",
    gender: true,
    notes: "Viděna u krmítka",
    seen: true,
    count: 3,
    imageURL:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Parus_major_2_Luc_Viatour.jpg/1280px-Parus_major_2_Luc_Viatour.jpg",
  },
  {
    id: "2",
    name: "Pěnkava obecná",
    latinName: "Fringilla coelebs",
    order: "Pěvci",
    family: "Pěnkavovití",
    location: { lat: 49.1951, lng: 16.6068 },
    date: "2024-04-02",
    gender: true,
    notes: "Zpívala na větvi",
    seen: true,
    count: 1,
    imageURL:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Buchfink_%2811%29_%2834980808596%29.jpg/1280px-Buchfink_%2811%29_%2834980808596%29.jpg",
  },
  {
    id: "3",
    name: "Čáp bílý",
    latinName: "Ciconia ciconia",
    order: "Brodiví",
    family: "Čapovití",
    location: { lat: 50.2092, lng: 15.8328 },
    date: "2024-05-10",
    gender: true,
    notes: "Na louce u řeky",
    seen: false,
    count: 2,
    imageURL:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Wei%C3%9Fstorch_Walsrode_2014_02.jpg/960px-Wei%C3%9Fstorch_Walsrode_2014_02.jpg",
  },
  {
    id: "4",
    name: "Kos černý",
    latinName: "Turdus merula",
    order: "Pěvci",
    family: "Drozdovití",
    location: { lat: 50.0755, lng: 14.4378 },
    date: "2024-03-20",
    gender: true,
    notes: "Zpíval ráno v parku",
    seen: false,
    count: 1,
    imageURL:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Blackbird_2.jpg/1280px-Blackbird_2.jpg",
  },
  {
    id: "5",
    name: "Ledňáček říční",
    latinName: "Alcedo atthis",
    order: "Srostloprstí",
    family: "Ledňáčkovití",
    location: { lat: 49.7444, lng: 13.3775 },
    date: "2024-06-01",
    gender: false,
    notes: "U potoka, velmi rychlý",
    seen: true,
    count: 1,
    imageURL:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Common_Kingfisher_Alcedo_atthis.jpg/960px-Common_Kingfisher_Alcedo_atthis.jpg",
  },
];

app.get("/", async (c) => {
  const index = await ejs.renderFile("src/views/index.ejs", {
    title: "Birds",
    birds
  });

  return c.html(index);
});

serve(app, (info) => {
  console.log(`Server listening at http://localhost:${info.port}`);
});

app.get("/json", (c) => {
  // c.json funkce vytvoří JSON odpověď
  return c.json(birds);
});

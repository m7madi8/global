const res = await fetch("http://localhost:3456/");
const text = await res.text();
console.log("status", res.status, "len", text.length);
console.log("has location", text.includes('id="location"'));
console.log("has frame", text.includes("place-luxe__frame"));
const i = text.indexOf("location");
console.log(text.slice(Math.max(0, i - 60), i + 80));

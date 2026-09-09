import fs from "node:fs";
const path = "/home/ubuntu/credwise-ai/client/src/pages/Home.tsx";
let text = fs.readFileSync(path, "utf8");
text = text.replaceAll("{profile.user.initials}", "{initials}");
text = text.replaceAll("{auth.user?.name ?? profile.user.name}", "{displayName}");
fs.writeFileSync(path, text);
console.log("Updated dashboard identity bindings");

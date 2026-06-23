import fs from 'fs';
import path from 'path';

function replaceInFile(filePath, search, replacement) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(search, replacement);
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${filePath}`);
  }
}

// 1. app-sidebar.tsx
replaceInFile(
  'c:\\Users\\pn.tund2\\Documents\\Repository\\omnidesk\\apps\\core\\src\\components\\app-sidebar.tsx',
  '<Link to="/app/dashboard">',
  '<Link to="/app/$appId" params={{ appId: "dashboard" }}>'
);

// 2. file-browser-app.tsx & file-row.tsx
const fileBrowserAppPath = 'c:\\Users\\pn.tund2\\Documents\\Repository\\omnidesk\\apps\\file-browser\\src\\components\\file-browser-app.tsx';
if (fs.existsSync(fileBrowserAppPath)) {
  let content = fs.readFileSync(fileBrowserAppPath, 'utf8');
  content = content.replace(/@\/components\/ui\/button/g, '@omnidesk/ui');
  content = content.replace(/@\/components\/ui\/table/g, '@omnidesk/ui');
  content = content.replace(/@\/components\/ui\/input/g, '@omnidesk/ui');
  content = content.replace(/e: any/g, 'e: React.ChangeEvent<HTMLInputElement>'); // line 66 error
  fs.writeFileSync(fileBrowserAppPath, content);
}
const fileRowPath = 'c:\\Users\\pn.tund2\\Documents\\Repository\\omnidesk\\apps\\file-browser\\src\\components\\file-row.tsx';
if (fs.existsSync(fileRowPath)) {
  let content = fs.readFileSync(fileRowPath, 'utf8');
  content = content.replace(/@\/components\/ui\/button/g, '@omnidesk/ui');
  content = content.replace(/@\/components\/ui\/table/g, '@omnidesk/ui');
  content = content.replace(/@\/components\/ui\/dropdown-menu/g, '@omnidesk/ui');
  fs.writeFileSync(fileRowPath, content);
}

// 3. launcher/src/pages/app-detail-page.tsx
replaceInFile(
  'c:\\Users\\pn.tund2\\Documents\\Repository\\omnidesk\\apps\\launcher\\src\\pages\\app-detail-page.tsx',
  /to="\/app-store"/g,
  'to="/app/$appId" params={{ appId: "launcher" }}'
);

// 4. projects/src/detail.tsx
replaceInFile(
  'c:\\Users\\pn.tund2\\Documents\\Repository\\omnidesk\\apps\\projects\\src\\detail.tsx',
  /to="\/projects"/g,
  'to="/app/$appId" params={{ appId: "projects" }}'
);

// 5. platform/web/src/routes/index.lazy.tsx
replaceInFile(
  'c:\\Users\\pn.tund2\\Documents\\Repository\\omnidesk\\platform\\web\\src\\routes\\index.lazy.tsx',
  'to="/dashboard"',
  'to="/app/$appId" params={{ appId: "dashboard" }}'
);

// 6. fix NavMain types in core/src/components/nav-main.tsx
// It uses item.url but we can't type check dynamic urls easily if they are strings.
// Wait, we can cast it in app-sidebar.tsx
replaceInFile(
  'c:\\Users\\pn.tund2\\Documents\\Repository\\omnidesk\\apps\\core\\src\\components\\app-sidebar.tsx',
  'url: item.url,',
  'url: item.url as any,'
);

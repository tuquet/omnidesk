import fs from 'fs/promises';
import path from 'path';

const APPS_DIR = path.join(process.cwd(), 'apps');

async function syncVersions() {
  console.log('🔄 Đang đồng bộ version cho các ứng dụng Tauri...');
  
  try {
    const apps = await fs.readdir(APPS_DIR, { withFileTypes: true });

    for (const app of apps) {
      if (!app.isDirectory()) continue;

      const appDir = path.join(APPS_DIR, app.name);
      const pkgPath = path.join(appDir, 'package.json');
      const tauriDir = path.join(appDir, 'src-tauri');
      
      try {
        // Kiểm tra xem app này có phải là Tauri app không
        const stat = await fs.stat(tauriDir);
        if (!stat.isDirectory()) continue;
      } catch (err) {
        // Không có src-tauri, bỏ qua
        continue;
      }

      try {
        // 1. Đọc package.json version
        const pkgContent = await fs.readFile(pkgPath, 'utf8');
        const pkg = JSON.parse(pkgContent);
        const version = pkg.version;
        
        if (!version) {
          console.warn(`⚠️ Bỏ qua ${app.name}: Không tìm thấy version trong package.json`);
          continue;
        }

        console.log(`\n📦 Đang xử lý [${app.name}] - Version mới: ${version}`);

        // 2. Cập nhật tauri.conf.json
        const tauriConfPath = path.join(tauriDir, 'tauri.conf.json');
        try {
          const tauriConfContent = await fs.readFile(tauriConfPath, 'utf8');
          const tauriConf = JSON.parse(tauriConfContent);
          
          if (tauriConf.version !== version) {
            tauriConf.version = version;
            await fs.writeFile(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n', 'utf8');
            console.log(`  ✅ Đã cập nhật tauri.conf.json -> ${version}`);
          } else {
            console.log(`  ✅ tauri.conf.json đã ở version ${version}`);
          }
        } catch (err) {
          console.warn(`  ⚠️ Lỗi khi cập nhật tauri.conf.json: ${err.message}`);
        }

        // 3. Cập nhật Cargo.toml
        const cargoTomlPath = path.join(tauriDir, 'Cargo.toml');
        try {
          let cargoTomlContent = await fs.readFile(cargoTomlPath, 'utf8');
          
          // Regex để tìm dòng `version = "..."` nằm ngay dưới `[package]`
          // Cách an toàn hơn: replace dòng bắt đầu bằng version
          // giả sử version = "x.y.z" là thuộc về [package]
          const updatedCargoToml = cargoTomlContent.replace(
            /^version\s*=\s*"[^"]*"/m,
            `version = "${version}"`
          );
          
          if (updatedCargoToml !== cargoTomlContent) {
            await fs.writeFile(cargoTomlPath, updatedCargoToml, 'utf8');
            console.log(`  ✅ Đã cập nhật Cargo.toml -> ${version}`);
          } else {
            console.log(`  ✅ Cargo.toml đã ở version ${version} (hoặc không tìm thấy field)`);
          }
        } catch (err) {
          console.warn(`  ⚠️ Lỗi khi cập nhật Cargo.toml: ${err.message}`);
        }

      } catch (err) {
        console.error(`❌ Lỗi xử lý thư mục ${app.name}:`, err);
      }
    }
    
    console.log('\n🎉 Hoàn tất đồng bộ version!');
  } catch (error) {
    console.error('Lỗi khi đọc thư mục apps:', error);
    process.exit(1);
  }
}

syncVersions();

import fs from 'fs/promises';
import path from 'path';

const WORKSPACE_DIRS = ['apps', 'packages'];

// Hàm so sánh version đơn giản (bỏ qua tiền tố ^, ~, >=)
function compareVersions(v1, v2) {
  const cleanV1 = v1.replace(/^[^\d]+/, '');
  const cleanV2 = v2.replace(/^[^\d]+/, '');
  
  const p1 = cleanV1.split('.').map(Number);
  const p2 = cleanV2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
}

async function syncDeps() {
  console.log('🔄 Bắt đầu quét dependencies trong toàn bộ workspace...\n');
  
  const packagePaths = [path.join(process.cwd(), 'package.json')];
  
  for (const dir of WORKSPACE_DIRS) {
    const fullDirPath = path.join(process.cwd(), dir);
    try {
      const entries = await fs.readdir(fullDirPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          packagePaths.push(path.join(fullDirPath, entry.name, 'package.json'));
        }
      }
    } catch (err) {
      if (err.code !== 'ENOENT') console.warn(`⚠️ Không thể đọc thư mục ${dir}:`, err.message);
    }
  }

  // Map lưu trữ: Tên thư viện -> { highestVersion, files: [{ path, version, type }] }
  const depsMap = new Map();

  for (const pkgPath of packagePaths) {
    try {
      const content = await fs.readFile(pkgPath, 'utf8');
      const pkg = JSON.parse(content);
      const relativePath = path.relative(process.cwd(), pkgPath);

      ['dependencies', 'devDependencies'].forEach(type => {
        if (!pkg[type]) return;
        for (const [depName, version] of Object.entries(pkg[type])) {
          // Bỏ qua các dependency trỏ nội bộ (workspace:*, link:...)
          if (version.startsWith('workspace:') || version.startsWith('link:') || version.startsWith('file:')) {
            continue;
          }

          if (!depsMap.has(depName)) {
            depsMap.set(depName, { highestVersion: version, uses: [] });
          }

          const depData = depsMap.get(depName);
          depData.uses.push({ path: relativePath, version, type, pkgContent: pkg });

          // Cập nhật highestVersion nếu tìm thấy version cao hơn
          try {
            if (compareVersions(version, depData.highestVersion) > 0) {
              depData.highestVersion = version;
            }
          } catch (e) {
            // Fallback nếu version chứa tag lạ (như 'latest' hoặc URL)
            if (version !== depData.highestVersion && version !== 'latest') {
               // Không so sánh được, giữ nguyên
            }
          }
        }
      });
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error(`❌ Lỗi đọc ${pkgPath}:`, err.message);
      }
    }
  }

  let mismatchCount = 0;
  const packagesToUpdate = new Set();
  const updateQueue = new Map(); // key: path, value: modified JSON object

  for (const [depName, data] of depsMap.entries()) {
    const uniqueVersions = new Set(data.uses.map(u => u.version));
    
    if (uniqueVersions.size > 1) {
      mismatchCount++;
      console.log(`⚠️ Mismatch [${depName}]:`);
      console.log(`   🔸 Version cao nhất được chọn: ${data.highestVersion}`);
      
      for (const use of data.uses) {
        if (use.version !== data.highestVersion) {
          console.log(`      - ${use.path} đang dùng ${use.version} (${use.type}) -> Sẽ cập nhật lên ${data.highestVersion}`);
          
          if (!updateQueue.has(use.path)) {
            updateQueue.set(use.path, use.pkgContent);
          }
          const pkgToUpdate = updateQueue.get(use.path);
          pkgToUpdate[use.type][depName] = data.highestVersion;
          packagesToUpdate.add(use.path);
        }
      }
      console.log('');
    }
  }

  if (mismatchCount === 0) {
    console.log('✅ Hoàn hảo! Toàn bộ dependencies trong workspace đã đồng bộ version.');
    return;
  }

  console.log(`\n💾 Đang ghi đè ${packagesToUpdate.size} file package.json...`);
  
  for (const [pkgPath, modifiedPkg] of updateQueue.entries()) {
    try {
      const absolutePath = path.join(process.cwd(), pkgPath);
      await fs.writeFile(absolutePath, JSON.stringify(modifiedPkg, null, 2) + '\n', 'utf8');
      console.log(`   ✅ Đã cập nhật ${pkgPath}`);
    } catch (err) {
      console.error(`   ❌ Lỗi khi ghi file ${pkgPath}:`, err.message);
    }
  }
  
  console.log('\n🎉 Hoàn tất đồng bộ dependencies! Bạn nên chạy `pnpm install` lại để cập nhật pnpm-lock.yaml.');
}

syncDeps();

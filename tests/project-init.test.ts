import * as fs from 'fs';
import * as path from 'path';

describe('Project Initialization', () => {
  describe('package.json configuration', () => {
    let packageJson: any;

    beforeAll(() => {
      const packagePath = path.join(__dirname, '..', 'package.json');
      const packageContent = fs.readFileSync(packagePath, 'utf-8');
      packageJson = JSON.parse(packageContent);
    });

    test('should have correct project name', () => {
      expect(packageJson.name).toBe('dajiexianxiang-choice');
    });

    test('should have required dependencies', () => {
      const requiredDeps = ['express', 'pg', 'cors', 'dotenv', 'jsonwebtoken'];
      requiredDeps.forEach(dep => {
        expect(packageJson.dependencies).toHaveProperty(dep);
      });
    });

    test('should have required dev dependencies', () => {
      const requiredDevDeps = [
        '@types/express',
        '@types/node',
        '@types/pg',
        '@types/cors',
        '@types/jsonwebtoken',
        'typescript',
        'tsx',
        'jest',
        'ts-jest',
        'fast-check'
      ];
      requiredDevDeps.forEach(dep => {
        expect(packageJson.devDependencies).toHaveProperty(dep);
      });
    });

    test('should have required scripts', () => {
      const requiredScripts = [
        'dev',
        'build',
        'start',
        'test',
        'test:unit',
        'test:property',
        'test:integration',
        'test:coverage',
        'migrate'
      ];
      requiredScripts.forEach(script => {
        expect(packageJson.scripts).toHaveProperty(script);
      });
    });

    test('should specify Node.js version requirement', () => {
      expect(packageJson.engines).toHaveProperty('node');
      expect(packageJson.engines.node).toMatch(/>=18/);
    });
  });

  describe('TypeScript configuration', () => {
    let tsConfig: any;

    beforeAll(() => {
      const tsConfigPath = path.join(__dirname, '..', 'tsconfig.json');
      const tsConfigContent = fs.readFileSync(tsConfigPath, 'utf-8');
      tsConfig = JSON.parse(tsConfigContent);
    });

    test('should have strict mode enabled', () => {
      expect(tsConfig.compilerOptions.strict).toBe(true);
    });

    test('should target ES2022', () => {
      expect(tsConfig.compilerOptions.target).toBe('ES2022');
    });

    test('should use commonjs module system', () => {
      expect(tsConfig.compilerOptions.module).toBe('commonjs');
    });

    test('should have correct output directory', () => {
      expect(tsConfig.compilerOptions.outDir).toBe('./dist');
    });

    test('should have correct root directory', () => {
      expect(tsConfig.compilerOptions.rootDir).toBe('./src');
    });

    test('should enable esModuleInterop', () => {
      expect(tsConfig.compilerOptions.esModuleInterop).toBe(true);
    });

    test('should include src directory', () => {
      expect(tsConfig.include).toContain('src/**/*');
    });

    test('should exclude node_modules and dist', () => {
      expect(tsConfig.exclude).toContain('node_modules');
      expect(tsConfig.exclude).toContain('dist');
    });
  });

  describe('Project structure', () => {
    test('should have src directory', () => {
      const srcPath = path.join(__dirname, '..', 'src');
      expect(fs.existsSync(srcPath)).toBe(true);
      expect(fs.statSync(srcPath).isDirectory()).toBe(true);
    });

    test('should have migrations directory', () => {
      const migrationsPath = path.join(__dirname, '..', 'migrations');
      expect(fs.existsSync(migrationsPath)).toBe(true);
      expect(fs.statSync(migrationsPath).isDirectory()).toBe(true);
    });

    test('should have scripts directory', () => {
      const scriptsPath = path.join(__dirname, '..', 'scripts');
      expect(fs.existsSync(scriptsPath)).toBe(true);
      expect(fs.statSync(scriptsPath).isDirectory()).toBe(true);
    });

    test('should have .env.example file', () => {
      const envExamplePath = path.join(__dirname, '..', '.env.example');
      expect(fs.existsSync(envExamplePath)).toBe(true);
    });

    test('should have zbpack.json for Zeabur deployment', () => {
      const zbpackPath = path.join(__dirname, '..', 'zbpack.json');
      expect(fs.existsSync(zbpackPath)).toBe(true);
    });
  });

  describe('Environment configuration', () => {
    let envExample: string;

    beforeAll(() => {
      const envExamplePath = path.join(__dirname, '..', '.env.example');
      envExample = fs.readFileSync(envExamplePath, 'utf-8');
    });

    test('should include DATABASE_URL', () => {
      expect(envExample).toContain('DATABASE_URL');
    });

    test('should include ADMIN_PASSWORD_HASH', () => {
      expect(envExample).toContain('ADMIN_PASSWORD_HASH');
    });

    test('should include JWT_SECRET', () => {
      expect(envExample).toContain('JWT_SECRET');
    });

    test('should include PORT', () => {
      expect(envExample).toContain('PORT');
    });

    test('should include NODE_ENV', () => {
      expect(envExample).toContain('NODE_ENV');
    });
  });

  describe('Zeabur configuration', () => {
    let zbpackConfig: any;

    beforeAll(() => {
      const zbpackPath = path.join(__dirname, '..', 'zbpack.json');
      const zbpackContent = fs.readFileSync(zbpackPath, 'utf-8');
      zbpackConfig = JSON.parse(zbpackContent);
    });

    test('should have build command', () => {
      expect(zbpackConfig).toHaveProperty('build_command');
      expect(zbpackConfig.build_command).toBe('npm run build');
    });

    test('should have start command', () => {
      expect(zbpackConfig).toHaveProperty('start_command');
      expect(zbpackConfig.start_command).toBe('npm start');
    });

    test('should have install command', () => {
      expect(zbpackConfig).toHaveProperty('install_command');
      expect(zbpackConfig.install_command).toBe('npm install');
    });
  });
});

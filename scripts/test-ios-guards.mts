// Compile the exact native guard sources in an isolated macOS Swift package.
// This verifies pure guards, NOT the iOS UI, WalletConnect SDK or release archive.
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const root = process.argv[2];
if (!root) throw new Error('Usage: npx tsx scripts/test-ios-guards.mts /absolute/path/to/ios/Bobby [git-ref]');
const input = resolve(root);
const ref = process.argv[3];
const commit = ref ? execFileSync('git', ['-C', input, 'rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`], { encoding: 'utf8' }).trim() : null;
const prefix = commit ? execFileSync('git', ['-C', input, 'rev-parse', '--show-prefix'], { encoding: 'utf8' }).trim() : '';
const readInput = (file: string): Buffer => commit
  ? execFileSync('git', ['-C', input, 'show', `${commit}:${prefix}${file}`])
  : readFileSync(join(input, file));
console.log(`Input: ${commit ?? 'working tree (including uncommitted changes)'}`);
const scratch = mkdtempSync(join(tmpdir(), 'bobby-native-guards-'));
const files = [
  'Sources/BaseSwap.swift', 'Sources/RPCCorrelator.swift',
  'Tests/BaseSwapGuardTests.swift', 'Tests/RPCCorrelatorTests.swift',
];
const digest = (body: Buffer) => createHash('sha256').update(body).digest('hex');
const hashes = new Map<string, string>();
for (const dir of ['Sources/Bobby', 'Tests/BobbyTests']) mkdirSync(join(scratch, dir), { recursive: true });
for (const file of files) {
  const body = readInput(file);
  const folder = file.startsWith('Sources/') ? 'Sources/Bobby' : 'Tests/BobbyTests';
  writeFileSync(join(scratch, folder, file.split('/').at(-1)!), body);
  hashes.set(file, digest(body));
  console.log(`${file} sha256=${digest(body)}`);
}
writeFileSync(join(scratch, 'Package.swift'), `// swift-tools-version: 5.9
import PackageDescription
let package = Package(name: "BobbyGuards", platforms: [.macOS(.v13)], targets: [
  .target(name: "Bobby"), .testTarget(name: "BobbyTests", dependencies: ["Bobby"])
])
`);
// Only application/transport dependencies are stubbed; no guard code is rewritten.
// The fixture has no credentials, never calls the API, and names a reserved domain.
writeFileSync(join(scratch, 'Sources/Bobby/TransportStubs.swift'), `import Foundation
enum L { static func t(_ en: String, _ es: String) -> String { en } }
struct BobbyWalletSession { let token: String }
enum BobbyAPI { static let base = URL(string: "https://bobby-native-tests.invalid")! }
enum WalletBridge { static let origin = "https://bobby-native-tests.invalid" }
extension JSONDecoder { static var bobby: JSONDecoder { JSONDecoder() } }
`);
console.log(`Isolated package: ${scratch}`);
const result = spawnSync('swift', ['test', '--package-path', scratch, '--jobs', '2'], { stdio: 'inherit' });
let changed = false;
for (const [file, hash] of hashes) {
  if (digest(readInput(file)) !== hash) {
    console.error(`SOURCE CHANGED DURING TEST: ${file}; result cannot certify the working tree`);
    changed = true;
  }
}
if (result.error) throw result.error;
process.exitCode = changed ? 1 : result.status ?? 1;

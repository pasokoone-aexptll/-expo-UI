const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

// Expo Go's precompiled MapKit cannot be changed. Apply only at native prebuild.
const marker = '// DreamCloud: flat MapKit elevation';
function patchFlatMap(source) {
  if (source.includes(marker)) return source;
  for (const selector of ['- (void)setPreferredConfiguration:', '- (void)didMoveToWindow']) {
    if (source.includes(selector)) throw new Error(`Flat Apple Map: upstream now implements ${selector}; review plugin before building.`);
  }
  const insertion = '- (instancetype)init\n';
  if (!source.includes(insertion)) throw new Error('Flat Apple Map: AIRMap initializer changed; review plugin before building.');
  return source.replace(insertion, `${marker}
- (void)setPreferredConfiguration:(MKMapConfiguration *)configuration API_AVAILABLE(ios(16.0))
{
    MKMapConfiguration *flatConfiguration = [configuration copy];
    flatConfiguration.elevationStyle = MKMapElevationStyleFlat;
    [super setPreferredConfiguration:flatConfiguration];
}

- (void)didMoveToWindow
{
    [super didMoveToWindow];
    if (@available(iOS 16.0, *)) {
        if (self.window) {
            MKStandardMapConfiguration *configuration = [[MKStandardMapConfiguration alloc]
                initWithElevationStyle:MKMapElevationStyleFlat emphasisStyle:MKStandardMapEmphasisStyleMuted];
            configuration.pointOfInterestFilter = [MKPointOfInterestFilter filterExcludingAllCategories];
            self.preferredConfiguration = configuration;
        }
    }
}

${insertion}`);
}
module.exports = config => withDangerousMod(config, ['ios', async config => {
  const packageJson = require.resolve('react-native-maps/package.json', { paths: [config.modRequest.projectRoot] });
  const file = path.join(path.dirname(packageJson), 'ios/AirMaps/AIRMap.mm');
  fs.writeFileSync(file, patchFlatMap(fs.readFileSync(file, 'utf8')));
  return config;
}]);
module.exports.patchFlatMap = patchFlatMap;

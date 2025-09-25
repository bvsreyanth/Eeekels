export enum LogSourceProvider {
  Default = 0,
  SentinelOne = 1,
  FortiAnalyzer = 2,
  Defender = 3,
  Splunk = 4
}

export const LogSourceProviderDisplayMap: Record<LogSourceProvider, string> = {
    [LogSourceProvider.Default]: 'Default',
    [LogSourceProvider.SentinelOne]: 'SentinelOne',
    [LogSourceProvider.FortiAnalyzer]: 'FortiAnalyzer',
    [LogSourceProvider.Defender]: 'Defender',
    [LogSourceProvider.Splunk]: 'Splunk'
};

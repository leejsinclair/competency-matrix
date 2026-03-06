import { useState } from 'react';
import BitbucketConfigTab from '../components/BitbucketConfigTab';
import ConfluenceConfigTab from '../components/ConfluenceConfigTab';
import JiraConfigTab from '../components/JiraConfigTab';
import ProcessingTab from '../components/ProcessingTab';
import { TabPanelProps } from '../types';

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`configuration-tabpanel-${index}`}
      aria-labelledby={`configuration-tab-${index}`}
      {...other}
    >
      {value === index && <div className="py-4">{children}</div>}
    </div>
  );
}

export default function Configuration() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuration</h1>
        <p className="mt-1 text-sm text-gray-600">
          Configure your connector settings for Jira, Confluence, and Bitbucket.
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        {/* Tab Headers */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => handleTabChange(0)}
              className={`${
                tabValue === 0
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Jira Configuration
            </button>
            <button
              onClick={() => handleTabChange(1)}
              className={`${
                tabValue === 1
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Confluence Configuration
            </button>
            <button
              onClick={() => handleTabChange(2)}
              className={`${
                tabValue === 2
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Bitbucket Configuration
            </button>
            <button
              onClick={() => handleTabChange(3)}
              className={`${
                tabValue === 3
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Processing & Analysis
            </button>
          </nav>
        </div>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          <JiraConfigTab />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <ConfluenceConfigTab />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <BitbucketConfigTab />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <ProcessingTab />
        </TabPanel>
      </div>
    </div>
  );
}

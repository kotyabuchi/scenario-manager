'use client';

import { useState } from 'react';

import { ImportScenarioForm } from './ImportScenarioForm';
import { UrlInputStep } from './UrlInputStep';

import type { ParsedScenario } from '@/lib/scenario-fetcher';
import type { ScenarioSystem, Tag } from '../../interface';

type ImportPageContentProps = {
  systems: ScenarioSystem[];
  tags: Tag[];
};

export const ImportPageContent = ({
  systems,
  tags,
}: ImportPageContentProps) => {
  const [parsedData, setParsedData] = useState<ParsedScenario | null>(null);

  const handleParsed = (data: ParsedScenario) => {
    setParsedData(data);
  };

  const handleBack = () => {
    setParsedData(null);
  };

  if (parsedData) {
    return (
      <ImportScenarioForm
        parsedData={parsedData}
        systems={systems}
        tags={tags}
        onBack={handleBack}
      />
    );
  }

  return <UrlInputStep onParsed={handleParsed} />;
};

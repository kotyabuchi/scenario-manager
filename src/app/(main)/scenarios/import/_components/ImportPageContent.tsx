'use client';

import { useEffect, useRef, useState } from 'react';

import { parseScenarioUrlAction } from '../actions';
import { ImportScenarioForm } from './ImportScenarioForm';
import { UrlInputStep } from './UrlInputStep';

import type { ParsedScenario } from '@/lib/scenario-fetcher';
import type { ScenarioSystem, Tag } from '../../interface';

type ImportPageContentProps = {
  systems: ScenarioSystem[];
  tags: Tag[];
  initialUrl: string | undefined;
};

export const ImportPageContent = ({
  systems,
  tags,
  initialUrl,
}: ImportPageContentProps) => {
  const [parsedData, setParsedData] = useState<ParsedScenario | null>(null);
  const [isAutoParsing, setIsAutoParsing] = useState(false);
  const [autoParseError, setAutoParseError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  // initialUrl がある場合、マウント時に自動解析を実行
  useEffect(() => {
    if (!initialUrl) return;

    const controller = new AbortController();

    const autoParse = async () => {
      setIsAutoParsing(true);
      setAutoParseError(null);

      const result = await parseScenarioUrlAction(initialUrl);

      if (controller.signal.aborted) return;

      setIsAutoParsing(false);

      if (result.success) {
        setParsedData(result.data);
      } else {
        setAutoParseError(result.error.message);
        // エラーバナーにフォーカス（レンダリング完了後）
        requestAnimationFrame(() => errorRef.current?.focus());
      }
    };

    autoParse();

    return () => {
      controller.abort();
    };
  }, [initialUrl]);

  const handleParsed = (data: ParsedScenario) => {
    setParsedData(data);
  };

  const handleBack = () => {
    setParsedData(null);
    setAutoParseError(null);
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

  return (
    <UrlInputStep
      onParsed={handleParsed}
      initialUrl={initialUrl}
      isAutoParsing={isAutoParsing}
      autoParseError={autoParseError}
      errorRef={errorRef}
    />
  );
};

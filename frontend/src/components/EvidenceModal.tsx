import React, { useState } from 'react';

interface TaxonomyTerm {
  canonical: string;
  variants: string[];
}

interface Evidence {
  eventId: string;
  evidence: string;
  confidence: number;
  metadata: {
    pageId: string;
    title: string;
    space: string;
    labels: string[];
  };
  timestamp: string;
}

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  competency: {
    category: string;
    row: string;
    level: number;
    confidence: number;
    evidenceCount: number;
    evidence?: Evidence[];
  };
}

const EvidenceModal: React.FC<EvidenceModalProps> = ({ isOpen, onClose, competency }) => {
  const [expandedLabels, setExpandedLabels] = useState<Set<string>>(new Set());
  const [taxonomyTerms, setTaxonomyTerms] = useState<TaxonomyTerm[]>([]);
  const [termsLoading, setTermsLoading] = useState<boolean>(false);

  React.useEffect(() => {
    if (!isOpen || !competency?.row) {
      setTaxonomyTerms([]);
      return;
    }

    const fetchTaxonomyTerms = async () => {
      try {
        setTermsLoading(true);
        const response = await fetch(`/api/matrix/taxonomy/terms?subcategory=${encodeURIComponent(competency.row)}`);
        const data = await response.json();

        if (data?.success && data?.data?.terms) {
          setTaxonomyTerms(data.data.terms);
        } else {
          setTaxonomyTerms([]);
        }
      } catch {
        setTaxonomyTerms([]);
      } finally {
        setTermsLoading(false);
      }
    };

    fetchTaxonomyTerms();
  }, [isOpen, competency?.row]);

  if (!isOpen) return null;

  const toggleLabelExpansion = (label: string) => {
    const newExpanded = new Set(expandedLabels);
    if (newExpanded.has(label)) {
      newExpanded.delete(label);
    } else {
      newExpanded.add(label);
    }
    setExpandedLabels(newExpanded);
  };

  const constructConfluenceUrl = (space: string, pageId: string) => {
    return `https://circleci.atlassian.net/wiki/spaces/${space}/pages/${pageId}`;
  };

  const extractKeywords = (evidence: string) => {
    const matchedKeywords = evidence.match(/Matched keywords: (.+?) in document:/);
    if (matchedKeywords) return matchedKeywords[1];

    const foundKeywords = evidence.match(/Found keywords: (.+?) in /);
    if (foundKeywords) return foundKeywords[1];

    return 'N/A';
  };

  const normalizeKeyword = (value: string): string =>
    (value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

  const canonicalLookup = new Map<string, string>();
  taxonomyTerms.forEach((term) => {
    const canonical = term.canonical;
    [canonical, ...(term.variants || [])].forEach((value) => {
      const normalized = normalizeKeyword(value);
      if (normalized) {
        canonicalLookup.set(normalized, canonical);
      }
    });
  });

  const toCanonicalKeyword = (keyword: string): string => {
    const normalized = normalizeKeyword(keyword);
    return canonicalLookup.get(normalized) || keyword;
  };

  // Group evidence by labels (matched keywords)
  const groupEvidenceByLabel = () => {
    const labelMap = new Map<string, { count: number; pages: Set<string>; evidence: Evidence[] }>();

    if (!competency.evidence || competency.evidence.length === 0) {
      return labelMap;
    }

    competency.evidence.forEach((evidence) => {
      const keywords = extractKeywords(evidence.evidence);
      const keywordList = keywords
        .split(',')
        .map(k => k.trim())
        .filter((k) => k.length > 0 && k !== 'N/A')
        .map((keyword) => toCanonicalKeyword(keyword));

      const uniqueKeywordList = Array.from(new Set(keywordList));

      uniqueKeywordList.forEach((keyword) => {
        if (!labelMap.has(keyword)) {
          labelMap.set(keyword, { count: 0, pages: new Set(), evidence: [] });
        }

        const entry = labelMap.get(keyword)!;
        entry.count += 1;
        entry.pages.add(evidence.metadata.pageId);
        entry.evidence.push(evidence);
      });
    });

    return labelMap;
  };

  const labelMap = groupEvidenceByLabel();
  const sortedLabels = Array.from(labelMap.entries()).sort((a, b) => b[1].count - a[1].count);

  const foundKeywordSet = new Set(
    sortedLabels
      .map(([label]) => normalizeKeyword(label))
      .filter((label) => label.length > 0)
  );

  const missingTerms = taxonomyTerms.filter((term) => {
    const searchableValues = [term.canonical, ...(term.variants || [])]
      .map((value) => normalizeKeyword(value))
      .filter((value) => value.length > 0);

    return !searchableValues.some((value) => foundKeywordSet.has(value));
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[80vh] w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-green-600 text-white px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">{competency.row}</h2>
              <p className="text-green-100 text-sm">
                Level {competency.level} - {(competency.confidence * 100).toFixed(1)}% confidence
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-green-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Summary */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{competency.level}</div>
                <div className="text-sm text-gray-600">Achieved Level</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{(competency.confidence * 100).toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Confidence</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{competency.evidenceCount}</div>
                <div className="text-sm text-gray-600">Evidence Items</div>
              </div>
            </div>
          </div>

          {/* Taxonomy Terms Not Found */}
          <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Taxonomy Terms Not Found</h3>

            {termsLoading ? (
              <div className="text-sm text-gray-600">Loading taxonomy terms...</div>
            ) : taxonomyTerms.length === 0 ? (
              <div className="text-sm text-gray-600">No taxonomy terms available for this sub-category.</div>
            ) : missingTerms.length === 0 ? (
              <div className="text-sm text-green-700">All taxonomy terms for this sub-category were found in evidence.</div>
            ) : (
              <>
                <div className="text-sm text-gray-700 mb-3">
                  Missing {missingTerms.length} of {taxonomyTerms.length} taxonomy term{taxonomyTerms.length !== 1 ? 's' : ''}.
                </div>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {missingTerms.map((term) => (
                    <span
                      key={term.canonical}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-900 border border-amber-300"
                      title={term.variants?.length ? `Variants: ${term.variants.join(', ')}` : 'No variants'}
                    >
                      {term.canonical}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Evidence List Grouped by Labels */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Evidence Grouped by Keywords</h3>

            {sortedLabels.length > 0 ? (
              <div className="space-y-4">
                {sortedLabels.map(([label, data]) => {
                  // Get unique pages in this label group
                  const uniquePages = Array.from(new Set(
                    data.evidence.map(e => JSON.stringify({
                      pageId: e.metadata.pageId,
                      title: e.metadata.title,
                      space: e.metadata.space
                    }))
                  )).map(str => JSON.parse(str));

                  return (
                    <div key={label} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Label Header with Count */}
                      <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 sticky top-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-gray-800">{label}</span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-200 text-blue-800">
                              {data.count} match{data.count !== 1 ? 'es' : ''}
                            </span>
                            <span className="text-xs text-gray-600">
                              {uniquePages.length} page{uniquePages.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Pages List */}
                      <div className="bg-white">
                        <div className="space-y-2 p-4">
                          {uniquePages
                            .slice(0, expandedLabels.has(label) ? undefined : 5)
                            .map((page, idx) => (
                              <div key={`${label}-${page.pageId}-${idx}`} className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded border border-gray-100 hover:bg-gray-100 transition-colors">
                                <div className="flex-1">
                                  <a
                                    href={constructConfluenceUrl(page.space, page.pageId)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline block mb-1"
                                  >
                                    {page.title}
                                  </a>
                                  <div className="text-xs text-gray-500">Space: {page.space}</div>
                                </div>
                                <a
                                  href={constructConfluenceUrl(page.space, page.pageId)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-shrink-0 inline-flex items-center px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  Open
                                </a>
                              </div>
                            ))}

                          {/* Show More Button */}
                          {uniquePages.length > 5 && !expandedLabels.has(label) && (
                            <button
                              onClick={() => toggleLabelExpansion(label)}
                              className="w-full mt-2 py-2 px-3 text-center text-sm font-medium text-blue-600 bg-blue-50 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                            >
                              Show {uniquePages.length - 5} more {uniquePages.length - 5 === 1 ? 'page' : 'pages'}
                            </button>
                          )}

                          {/* Show Less Button */}
                          {expandedLabels.has(label) && uniquePages.length > 5 && (
                            <button
                              onClick={() => toggleLabelExpansion(label)}
                              className="w-full mt-2 py-2 px-3 text-center text-sm font-medium text-blue-600 bg-blue-50 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                            >
                              Show less
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-lg mb-2">No detailed evidence available</div>
                <div className="text-sm">This competency was scored based on aggregated data.</div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Total: {competency.evidence?.length || 0} evidence items
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvidenceModal;

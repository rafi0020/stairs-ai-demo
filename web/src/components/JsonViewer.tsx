import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

interface JsonViewerProps {
  data: unknown;
  maxHeight?: number;
  initialExpanded?: boolean;
}

export default function JsonViewer({ data, maxHeight = 400, initialExpanded = true }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  return (
    <div className="relative">
      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded bg-gray-700 hover:bg-gray-600 transition-colors z-10"
        title="Copy JSON"
      >
        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
      </button>

      {/* JSON content */}
      <div 
        className="font-mono text-sm overflow-auto pr-8"
        style={{ maxHeight }}
      >
        <JsonNode data={data} initialExpanded={initialExpanded} depth={0} />
      </div>
    </div>
  );
}

interface JsonNodeProps {
  data: unknown;
  initialExpanded: boolean;
  depth: number;
  keyName?: string;
}

function JsonNode({ data, initialExpanded, depth, keyName }: JsonNodeProps) {
  const [expanded, setExpanded] = useState(initialExpanded && depth < 2);

  const indent = depth * 16;

  // Render primitive values
  if (data === null) {
    return (
      <span className="text-gray-500">
        {keyName && <span className="text-blue-400">"{keyName}"</span>}
        {keyName && <span className="text-gray-400">: </span>}
        <span className="text-gray-500">null</span>
      </span>
    );
  }

  if (typeof data === 'boolean') {
    return (
      <span>
        {keyName && <span className="text-blue-400">"{keyName}"</span>}
        {keyName && <span className="text-gray-400">: </span>}
        <span className="text-purple-400">{data ? 'true' : 'false'}</span>
      </span>
    );
  }

  if (typeof data === 'number') {
    return (
      <span>
        {keyName && <span className="text-blue-400">"{keyName}"</span>}
        {keyName && <span className="text-gray-400">: </span>}
        <span className="text-yellow-400">{data}</span>
      </span>
    );
  }

  if (typeof data === 'string') {
    return (
      <span>
        {keyName && <span className="text-blue-400">"{keyName}"</span>}
        {keyName && <span className="text-gray-400">: </span>}
        <span className="text-green-400">"{data}"</span>
      </span>
    );
  }

  // Render arrays
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return (
        <span>
          {keyName && <span className="text-blue-400">"{keyName}"</span>}
          {keyName && <span className="text-gray-400">: </span>}
          <span className="text-gray-400">[]</span>
        </span>
      );
    }

    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center hover:bg-gray-700/50 rounded px-1 -ml-1"
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {keyName && <span className="text-blue-400 ml-1">"{keyName}"</span>}
          {keyName && <span className="text-gray-400">: </span>}
          <span className="text-gray-400">[</span>
          {!expanded && (
            <span className="text-gray-500 text-xs ml-1">
              {data.length} items
            </span>
          )}
          {!expanded && <span className="text-gray-400">]</span>}
        </button>
        {expanded && (
          <>
            <div style={{ marginLeft: indent + 16 }}>
              {data.map((item, idx) => (
                <div key={idx} className="py-0.5">
                  <JsonNode 
                    data={item} 
                    initialExpanded={initialExpanded} 
                    depth={depth + 1} 
                  />
                  {idx < data.length - 1 && <span className="text-gray-400">,</span>}
                </div>
              ))}
            </div>
            <span className="text-gray-400" style={{ marginLeft: indent }}>]</span>
          </>
        )}
      </div>
    );
  }

  // Render objects
  if (typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>);
    
    if (entries.length === 0) {
      return (
        <span>
          {keyName && <span className="text-blue-400">"{keyName}"</span>}
          {keyName && <span className="text-gray-400">: </span>}
          <span className="text-gray-400">{'{}'}</span>
        </span>
      );
    }

    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center hover:bg-gray-700/50 rounded px-1 -ml-1"
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {keyName && <span className="text-blue-400 ml-1">"{keyName}"</span>}
          {keyName && <span className="text-gray-400">: </span>}
          <span className="text-gray-400">{'{'}</span>
          {!expanded && (
            <span className="text-gray-500 text-xs ml-1">
              {entries.length} keys
            </span>
          )}
          {!expanded && <span className="text-gray-400">{'}'}</span>}
        </button>
        {expanded && (
          <>
            <div style={{ marginLeft: indent + 16 }}>
              {entries.map(([key, value], idx) => (
                <div key={key} className="py-0.5">
                  <JsonNode 
                    data={value} 
                    initialExpanded={initialExpanded} 
                    depth={depth + 1}
                    keyName={key}
                  />
                  {idx < entries.length - 1 && <span className="text-gray-400">,</span>}
                </div>
              ))}
            </div>
            <span className="text-gray-400" style={{ marginLeft: indent }}>{'}'}</span>
          </>
        )}
      </div>
    );
  }

  return <span className="text-gray-500">unknown</span>;
}

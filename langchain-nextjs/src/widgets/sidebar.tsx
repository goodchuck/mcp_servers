import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { useEffect, useState } from 'react';
import { getMcpList } from '../features/get-mcp-list/api/get-mcp-list';

interface MCPTool {
  name: string;
  description: string;
}

export default function Sidebar() {
  const [mcpList, setMcpList] = useState<MCPTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMcpTools = async () => {
    try {
      setLoading(true);
      const mcpTools = await getMcpList();
      setMcpList(mcpTools);
    } catch (error) {
      console.error(error);
      setError('도구 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-[300px] h-[100vh] border border-black p-4">
      <h2 className="text-xl font-bold mb-4">MCP 도구 목록</h2>
      <button onClick={fetchMcpTools}>test</button>
      {loading && <div>로딩 중...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <div className="space-y-2">
        {mcpList?.map((mcp, index) => (
          <div key={index} className="p-2 border rounded hover:bg-gray-100">
            <div className="font-medium">{mcp.name}</div>
            <div className="text-sm text-gray-600">{mcp.description}</div>
            {/* <div className="text-sm text-gray-600">{mcp.schema}</div> */}
          </div>
        ))}
      </div>
    </div>
  );
}

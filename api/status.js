const groups = [
  {
    id: "system",
    name: "System Status",
    providers: [
      {
        id: "local-mock",
        name: "Local Mock",
        status: "sandbox",
        role: "Mock response only",
      },
    ],
  },
];

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  return res.status(200).json({
    ok: true,
    systemStatus: "sandbox",
    mockOnly: true,
    productionExecution: false,
    externalCommunication: false,
    approvalConfirmed: false,
    actualRevenue: false,
    environment: "sandbox",
    groups,
    providers: groups.flatMap((group) => group.providers.map((provider) => ({ ...provider, groupId: group.id, groupName: group.name }))),
    nextBestAction: "OwnerはMock状態だけを確認してください。",
  });
}

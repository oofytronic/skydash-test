import { createHelia } from 'helia';

// create a Helia node
const helia = await createHelia();

async function publishToIPFS(jsonData) {
  // Add JSON data to IPFS
  const { cid } = await ipfs.add(JSON.stringify(jsonData));

  // Update IPNS key with new CID
  const ipnsKey = 'k51qzi5uqu5dh4bzmotfzj2qezrs1hbrkogs3zb7olevc6z51kccnrtdcoy55l';
  const { name } = await ipfs.name.publish(cid.toString(), { key: ipnsKey });

  return name;
}
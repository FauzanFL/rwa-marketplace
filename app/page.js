"use client"
import { useEffect, useState } from "react";
import contractAbi from "../utils/abi/RealAssetNFT.json";
import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

export default function Home() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [isWalletConnect, setIsWalletConnect] = useState(false);
  const [nftAssets, setNftAssets] = useState([]);
  const [dataAsset, setDataAsset] = useState({
    name: "",
    description: "",
    price: 0,
  })

  const getAllAsset = async () => {
    try {
      let nftContract = null
      if (!contract) {
        const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
        const signer = await provider.getSigner();
        nftContract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
      } else {
        nftContract = contract
      }

      const total = await nftContract.totalMinted();
      const assets = [];

      for (let i = 1; i < Number(total); i++) {
        const asset = await nftContract.assets(i);

        assets.push({
          tokendId: i,
          name: asset.name,
          description: asset.description,
          price: ethers.formatEther(asset.price),
          seller: asset.seller,
          forSale: asset.forSale
        }) 
      }

      setNftAssets(assets);
    } catch (err) {
      console.error("Error:", err);
    }
    
  }

  const checkWalletConnection = async () => {
    if (!window.ethereum) return alert("Metamask has not installed");

    const accounts = await window.ethereum.request({method: "eth_accounts"});
    if (accounts.length !== 0) {
      setCurrentAccount(ethers.getAddress(accounts[0]));
      setIsWalletConnect(true);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const nftContract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
      setContract(nftContract);
    }

  }

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Metamask has not installed");

    const accounts = await window.ethereum.request({method: "eth_requestAccounts"});
    if (accounts.length !== 0) {
      setCurrentAccount(accounts[0]);
      setIsWalletConnect(true);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const nftContract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
      setContract(nftContract);
    }
  }

  const mintAsset = async (event) => {
    event.preventDefault();

    if (dataAsset.name === "") {
      console.log("Name is required");
      return
    } else if (dataAsset.description === "") {
      console.log("Description is required");
      return
    } else if (dataAsset.price <= 0) {
      console.log("Price cannot less then or equal 0");
      return
    }

    if (!contract) {
      console.log("No contract");
      return
    }

    const tx = await contract.mintAsset(dataAsset.name, dataAsset.description, ethers.parseEther(dataAsset.price.toString()))
    await tx.wait();
    console.log(tx);
    console.log("Asset minted!");

    await getAllAsset();

    setDataAsset({
      name: "",
      description: "",
      price: 0,
    });
    setIsMintModalOpen(false);
  }

  const buyAsset = async (tokendId) => {
    if (!contract) {
      console.log("No contract");
      return
    }

    const asset = await contract.assets(tokendId);
    const tx = await contract.buyAsset(tokendId, {
      value: asset.price
    });

    await tx.wait();
    console.log("NFT bought successfully!")

    await getAllAsset();
  }

  const openModalHandler = () => {
    setIsMintModalOpen(true);
  }

  const closeModalHandler = () => {
    setIsMintModalOpen(false);
  }

  const inputHandler = (target) => {
    const dataTemp = dataAsset;
    if (target.name === "name") {
      dataTemp.name = target.value;
    } else if (target.name === "description") {
      dataTemp.description = target.value;
    } else if (target.name === "price") {
      dataTemp.price = parseFloat(target.value);
    }
    
    setDataAsset(dataTemp);
  }

  const Card = ({data}) => {
    return (
      <>
        <div className="p-3 border rounded-md wrap-break-word">
          <h5 className="font-semibold text-xl">{data.name}</h5>
          <p className="text-sm">{data.description}</p>
          <p className="text-sm">Price: {data.price} ETH</p>
          <p className="text-sm">Seller: <span className="font-medium">{data.seller}</span></p>
          { data.forSale === false ?
            <div className="flex justify-center mt-2">
              <button className="text-sm px-1 bg-gray-400 py-0.5 border rounded-md">Not For Sale</button>
            </div>
            :
            currentAccount !== null && data.seller !== currentAccount &&
            // currentAccount !== null ?
            <div className="flex justify-center mt-2">
              <button onClick={() => buyAsset(data.tokendId)} className="text-sm px-1 bg-amber-500 py-0.5 border rounded-md hover:bg-amber-600 hover:cursor-pointer">Buy</button>
            </div>
          }
        </div>
      </>
    )
  }

  const ModalMint = () => {
    return (
      <>
        <div onClick={closeModalHandler} className="fixed flex justify-center items-center right-0 left-0 top-0 bottom-0 bg-[rgba(31,41,55,0.4)]">
          <div onClick={(event) => event.stopPropagation()} className="fixed bg-white opacity-100 p-5 rounded-md">
            <h3 className="font-medium text-2xl">Mint Asset</h3>
            <button onClick={closeModalHandler} className="absolute border font-bold text-gray-600 rounded-md px-1.5 right-1.5 top-1.5 hover:cursor-pointer hover:text-gray-500">X</button>
            <form onSubmit={mintAsset} className="mt-3">
              <div className="flex flex-col my-1">
                <label className="mb-1">Name</label>
                <input onChange={({target}) => inputHandler(target)} className="outline outline-gray-400 focus:outline-2 rounded-sm p-1" name="name" type="text"/>
              </div>
              <div className="flex flex-col my-1">
                <label className="mb-1">Description</label>
                <input onChange={({target}) => inputHandler(target)} className="outline outline-gray-400 focus:outline-2 rounded-sm p-1" name="description" type="text"/>
              </div>
              <div className="flex flex-col my-1">
                <label className="mb-1">Price</label>
                <div className="flex justify-between items-center">
                  <input onChange={({target}) => inputHandler(target)} className="outline outline-gray-400 focus:outline-2 rounded-sm p-1" name="price" type="number" step="any"/>
                  <span className="text-gray-500 mx-1">ETH</span>
                </div>
              </div>
              <div className="mt-2 flex justify-center">
                <button className="shadow-sm px-1.5 rounded-sm bg-blue-500 text-white hover:cursor-pointer hover:bg-blue-600" type="submit">Mint</button>
              </div>
            </form>
          </div>
        </div>
      </>
    )
  }

  useEffect(() => {
    checkWalletConnection();
    getAllAsset();
  },[]);

  return (
    <>
      <div className="m-3 pb-2 border-b-1 flex justify-between">
        <h1 className="text-3xl font-bold">Real Asset Marketplace</h1>
        {
        isWalletConnect ? 
        <div className="flex gap-2 items-center">
          <p className="font-semibold">Address: {currentAccount}</p>
          <button onClick={openModalHandler} className="text-sm px-1 bg-green-400 py-0.5 border rounded-md hover:bg-green-500 hover:cursor-pointer">Mint Asset</button>
        </div>
        :
        <button onClick={connectWallet} className="border text-sm font-semibold rounded-lg duration-100 bg-slate-300 p-1 hover:bg-slate-400 hover:cursor-pointer">Connect Wallet</button>
        }
      </div>
      <div className={`m-3 p-1 ${ nftAssets.length !==0 ? "grid grid-cols-4 gap-3" : "flex justify-center"}`}>
        { nftAssets.length !== 0 ?
          nftAssets.map((d, i) => {
            return <Card key={i} data={d}/>
          })
          : 
          <div>
            <p className="text-2xl text-gray-500">No Asset found</p>
          </div>
        }
      </div>
      { isMintModalOpen && <ModalMint/> }
    </>
  );
}

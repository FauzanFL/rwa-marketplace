"use client"
import { useEffect, useState } from "react";
import contractAbi from "../utils/abi/RealAssetNFT.json";
import { ethers, getBigInt } from "ethers";

// Change this to adjust the contract address that have been deployed before
const CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

export default function Home() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState({})
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

      for (let i = 1; i <= Number(total); i++) {
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
      setCurrentAccount(ethers.getAddress(accounts[0]));
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

  // function checkData(obj1, obj2) {
  //   const keys1 = Object.keys(obj1);
  //   const keys2 = Object.keys(obj2);

  //   if (keys1.length !== keys2.length) return false;

  //   return keys1.every(key => obj2.hasOwnProperty(key) && obj1[key] === obj2[key]);
  // }

  const saveAsset = async (event) => {
    event.preventDefault();
    
    if (selectedAsset.name === "") {
      console.log("Name is required");
      return
    } else if (selectedAsset.description === "") {
      console.log("Description is required");
      return
    } else if (selectedAsset.price <= 0) {
      console.log("Price cannot less then or equal 0");
      return
    }

    if (!contract) {
      console.log("No contract");
      return
    }
    
    const updated = await contract.updateListing(selectedAsset.tokendId, selectedAsset.name, selectedAsset.description, ethers.parseEther(selectedAsset.price.toString()), selectedAsset.forSale);
    console.log("Update successfully");

    await updated.wait();

    await getAllAsset();
    closeModalEditHandler();
  }

  const openModalMintHandler = () => {
    setIsMintModalOpen(true);
  }

  const closeModalMintHandler = () => {
    setIsMintModalOpen(false);
  }

  const openModalEditHandler = (data) => {
    setSelectedAsset({...data});
    setIsEditModalOpen(true);
  }

  const closeModalEditHandler = () => {
    setIsEditModalOpen(false);
    setSelectedAsset({});
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

  const inputEditHandler = (target) => {
    const dataTemp = selectedAsset;
    if (target.name === "name-edit") {
      dataTemp.name = target.value;
    } else if (target.name === "description-edit") {
      dataTemp.description = target.value;
    } else if (target.name === "price-edit") {
      dataTemp.price = parseFloat(target.value);
    } else if (target.name === "forSale-edit") {
      dataTemp.forSale = target.checked;
    }
    
    setSelectedAsset(dataTemp);
  }

  const Card = ({data}) => {
    return (
      <>
        <div className="relative p-3 border rounded-md wrap-break-word bg-slate-100 shadow-md">
          {
            data.seller === currentAccount &&
            <button onClick={() => openModalEditHandler(data)} className="absolute text-xs top-2 right-2 underline hover:cursor-pointer hover:font-semibold hover:text-gray-600">Edit</button>
          }
          {
            !data.forSale && 
            <div className="text-rose-500 w-min-2/3 w-max-[100px] px-2 border-2 z-20 text-2xl font-bold absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45">Not For Sale</div>
          }
          <h5 className="font-semibold text-xl">{data.name}</h5>
          <div className="text-sm my-1">
            <p>Description: </p>
            <p className="text-xs">{data.description}</p>
          </div>
          <p className="text-sm">Price: {data.price} ETH</p>
          <p className="text-sm">Seller: <span className="font-medium">{data.seller}</span></p>
          { data.forSale && currentAccount !== null && data.seller !== currentAccount &&
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
        <div onClick={closeModalMintHandler} className="fixed flex justify-center items-center right-0 left-0 top-0 bottom-0 bg-[rgba(31,41,55,0.4)]">
          <div onClick={(event) => event.stopPropagation()} className="fixed bg-white opacity-100 p-5 rounded-md">
            <h3 className="font-medium text-2xl">Mint Asset</h3>
            <button onClick={closeModalMintHandler} className="absolute border font-bold text-gray-600 rounded-md px-1.5 right-1.5 top-1.5 hover:cursor-pointer hover:text-gray-500">X</button>
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

  const ModalEdit = () => {
    return (
      <>
        <div onClick={closeModalEditHandler} className="fixed flex justify-center items-center right-0 left-0 top-0 bottom-0 bg-[rgba(31,41,55,0.4)]">
          <div onClick={(event) => event.stopPropagation()} className="fixed bg-white opacity-100 p-5 rounded-md">
            <h3 className="font-medium text-2xl">Edit Asset</h3>
            <button onClick={closeModalEditHandler} className="absolute border font-bold text-gray-600 rounded-md px-1.5 right-1.5 top-1.5 hover:cursor-pointer hover:text-gray-500">X</button>
            <form onSubmit={saveAsset} className="mt-3">
              <div className="flex flex-col my-1">
                <label className="mb-1">Name</label>
                <input defaultValue={selectedAsset.name} onChange={({target}) => inputEditHandler(target)} className="outline outline-gray-400 focus:outline-2 rounded-sm p-1" name="name-edit" type="text"/>
              </div>
              <div className="flex flex-col my-1">
                <label className="mb-1">Description</label>
                <input defaultValue={selectedAsset.description} onChange={({target}) => inputEditHandler(target)} className="outline outline-gray-400 focus:outline-2 rounded-sm p-1" name="description-edit" type="text"/>
              </div>
              <div className="flex flex-col my-1">
                <label className="mb-1">Price</label>
                <div className="flex justify-between items-center">
                  <input defaultValue={selectedAsset.price} onChange={({target}) => inputEditHandler(target)} className="outline outline-gray-400 focus:outline-2 rounded-sm p-1" name="price-edit" type="number" step="any"/>
                  <span className="text-gray-500 mx-1">ETH</span>
                </div>
              </div>
              <div className="flex items-center my-1">
                <input onChange={({target}) => inputEditHandler(target)} type="checkbox" name="forSale-edit" className="mr-1" defaultChecked={selectedAsset.forSale}/>
                <span>For Sale</span>
              </div>
              <div className="mt-2 flex justify-center">
                <button className="shadow-sm px-1.5 rounded-sm bg-yellow-400 border hover:cursor-pointer hover:bg-yellow-500" type="submit">Save</button>
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
      <div className="m-3 pb-2 border-b-1 flex flex-col lg:flex-row justify-between">
        <h1 className="text-3xl font-bold mb-2">Real Asset Marketplace</h1>
        {
        isWalletConnect ? 
        <div className="flex flex-col lg:flex-row gap-2 lg:justify-end lg:items-center w-full">
          <p className="font-semibold overflow-hidden">Address: {currentAccount}</p>
          <button onClick={openModalMintHandler} className="text-sm px-1 bg-green-400 py-0.5 border rounded-md hover:bg-green-500 hover:cursor-pointer">Mint Asset</button>
        </div>
        :
        <button onClick={connectWallet} className="border text-sm font-semibold rounded-lg duration-100 bg-slate-300 p-1 hover:bg-slate-400 hover:cursor-pointer">Connect Wallet</button>
        }
      </div>
      <div className={`m-3 p-1 ${ nftAssets.length !==0 ? "grid grid-cols-2 md:grid-cols-4 gap-3" : "flex justify-center"}`}>
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
      { isEditModalOpen && <ModalEdit/> }
    </>
  );
}

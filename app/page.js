"use client"
import { useEffect, useState } from "react";
import contractAbi from "../utils/abi/RealAssetNFT.json";
import { ethers } from "ethers";
import Alert from "./Alert";
import { Trash2, Pencil } from "lucide-react";

// Change this to adjust the contract address that have been deployed before
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export default function Home() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState({});
  const [dataEdit, setDataEdit] = useState({});
  const [isWalletConnect, setIsWalletConnect] = useState(false);
  const [nftAssets, setNftAssets] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState("success");
  const [message, setMessage] = useState("Success!");
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

      const assets = await nftContract.getAllAssets();

      const assetsResult = assets.map((asset) => ({
        tokendId: asset.tokenId.toString(),
        name: asset.name,
        description: asset.description,
        price: ethers.formatEther(asset.price),
        seller: asset.seller,
        forSale: asset.forSale
      }));

      setNftAssets(assetsResult);
    } catch (err) {
      console.error("Error:", err);
    }
    
  }

  const checkWalletConnection = async () => {
    if (!window.ethereum) return alert("Metamask has not installed");

    try {
      const accounts = await window.ethereum.request({method: "eth_accounts"});
      if (accounts.length !== 0) {
        setCurrentAccount(ethers.getAddress(accounts[0]));
        setIsWalletConnect(true);
  
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const nftContract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
        setContract(nftContract);
      }
    } catch (err) {
      console.error("Error:", err);
    }

  }

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Metamask has not installed");

    try {
      const accounts = await window.ethereum.request({method: "eth_requestAccounts"});
      if (accounts.length !== 0) {
        setCurrentAccount(ethers.getAddress(accounts[0]));
        setIsWalletConnect(true);
  
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const nftContract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
        setContract(nftContract);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  }

  const mintAsset = async (event) => {
    event.preventDefault();

    if (dataAsset.name === "") {
      openAlert("Name is required", "warning");
      console.log("Name is required");
      closeAlert();
      return
    } else if (dataAsset.description === "") {
      openAlert("Description is required", "warning");
      console.log("Description is required");
      closeAlert();
      return
    } else if (dataAsset.price <= 0) {
      openAlert("Price cannot less then or equal 0", "warning");
      console.log("Price cannot less then or equal 0");
      closeAlert();
      return
    }

    if (!contract) {
      console.log("No contract");
      return
    }

    try {
      const tx = await contract.mintAsset(dataAsset.name, dataAsset.description, ethers.parseEther(dataAsset.price.toString()))
      await tx.wait();
      openAlert("Asset minted!");
      console.log("Asset minted!");
      closeAlert();
  
      await getAllAsset();
  
      setDataAsset({
        name: "",
        description: "",
        price: 0,
      });
      setIsMintModalOpen(false);
    } catch (err) {
      console.error("Error:", err);
    }
  }

  const buyAsset = async (tokendId) => {
    if (!contract) {
      console.log("No contract");
      return
    }

    try {
      const asset = await contract.assets(tokendId);
      const tx = await contract.buyAsset(tokendId, {
        value: asset.price
      });
  
      await tx.wait();
      openAlert("NFT bought successfully!");
      console.log("NFT bought successfully!");
      closeAlert();
  
      await getAllAsset();
    } catch (err) {
      console.error("Error:", err);
    }
  }

  const checkData = (obj1, obj2) => {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    return keys1.every(key => obj2.hasOwnProperty(key) && obj1[key] === obj2[key]);``
  }

  const openAlert = (message, type) => {
    setMessage(message);
    setAlertType(type);
    setShowAlert(true);
  }

  const closeAlert = () => {
    setTimeout(() => {
      setShowAlert(false);
      setMessage("");
      setAlertType("");
    }, 3000);
  }

  const saveAsset = async (event) => {
    event.preventDefault();
    
    if (checkData(dataEdit, selectedAsset)) {
      openAlert("No data changed detected", "warning");
      console.log("No data changed detected");
      closeAlert();
      return
    } else if (dataEdit.name === "") {
      openAlert("Name is required", "warning");
      console.log("Name is required");
      closeAlert();
      return
    } else if (dataEdit.description === "") {
      openAlert("Description is required", "warning");
      console.log("Description is required");
      closeAlert();
      return
    } else if (dataEdit.price <= 0) {
      openAlert("Price cannot less then or equal 0", "warning");
      console.log("Price cannot less then or equal 0");
      closeAlert();
      return
    }

    if (!contract) {
      console.log("No contract");
      return
    }
    
    try {
      const updated = await contract.updateListing(dataEdit.tokendId, dataEdit.name, dataEdit.description, ethers.parseEther(dataEdit.price.toString()), dataEdit.forSale);
      console.log("Update successfully");
      openAlert("Asset updated successfully!", "success");
      closeAlert();
  
      await updated.wait();
  
      await getAllAsset();
      closeModalEditHandler();
    } catch (err) {
      console.error("Error:", err);
    }
  }

  const burnAsset = async (tokenId) => {
    if(confirm("Are you sure to burn?")) {
      if (!contract) {
        console.log("No contract");
        return
      }

      try {
        const burnt = await contract.burnAsset(tokenId);
        openAlert("Asset burnt!", "success");
        console.log("Asset burnt!");
        closeAlert();
  
        await burnt.wait();
        await getAllAsset();
      } catch (err) {
        console.error("Error:", err);
      }
    } 
  }

  const openModalMintHandler = () => {
    setIsMintModalOpen(true);
  }

  const closeModalMintHandler = () => {
    setIsMintModalOpen(false);
  }

  const openModalEditHandler = (data) => {
    setSelectedAsset({...data});
    setDataEdit({...data});
    setIsEditModalOpen(true);
  }

  const closeModalEditHandler = () => {
    setIsEditModalOpen(false);
    setSelectedAsset({});
    setDataEdit({});
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
    const dataTemp = dataEdit
    if (target.name === "name-edit") {
      dataTemp.name = target.value;
    } else if (target.name === "description-edit") {
      dataTemp.description = target.value;
    } else if (target.name === "price-edit") {
      dataTemp.price = parseFloat(target.value);
    } else if (target.name === "forSale-edit") {
      dataTemp.forSale = target.checked;
    }
    
    setDataEdit(dataTemp);
  }

  const Card = ({data}) => {
    return (
      <>
        <div className="relative max-w-sm p-6 rounded-2xl shadow-xl bg-white border border-gray-200 space-y-4 wrap-break-word ">
          {
            data.seller === currentAccount &&
            <div className="absolute top-3 right-3 flex space-x-2">
              <button onClick={() => burnAsset(data.tokendId)} className="text-red-600 hover:text-red-800 flex items-center gap-1 text-sm hover:cursor-pointer">
                <Trash2 className="w-4 h-4"/>Burn
              </button>
              <button onClick={() => openModalEditHandler(data)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm hover:cursor-pointer">
                <Pencil className="w-4 h-4"/>Edit
              </button>
            </div>
          }
          {
            !data.forSale && 
            <div className="text-rose-500 border-2 border-rose-500 px-4 py-1 text-2xl font-bold absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 z-10 whitespace-nowrap bg-white/80 rounded-md">Not For Sale</div>
          }
          <h2 className="font-bold text-2xl text-gray-800">{data.name}</h2>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Description: </p>
            <p className="text-gray-700 font-medium">{data.description}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Price: </p>
            <p className="text-lg font-semibold text-green-600">{data.price} ETH</p>
          </div>
          <div className="space-y-1 overflow-hidden">
            <p className="text-sm text-gray-500">Seller: </p>
            <p className="text-xs text-gray-700 break-words">{data.seller}</p>
          </div>
          { data.forSale && currentAccount !== null && data.seller !== currentAccount &&
            <div className="flex justify-center mt-2">
              <button onClick={() => buyAsset(data.tokendId)} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-0.5 hover:cursor-pointer">Buy Now</button>
            </div>
          }
        </div>
      </>
    )
  }

  const ModalMint = () => {
    return (
      <>
        <div onClick={closeModalMintHandler} className="fixed flex justify-center items-center z-20 right-0 left-0 top-0 bottom-0 bg-[rgba(31,41,55,0.4)]">
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
                <button className="shadow-md px-2 py-0.5 rounded-sm bg-sky-500 text-white hover:cursor-pointer hover:bg-sky-400" type="submit">Mint</button>
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
        <div onClick={closeModalEditHandler} className="fixed flex justify-center items-center z-20 right-0 left-0 top-0 bottom-0 bg-[rgba(31,41,55,0.4)]">
          <div onClick={(event) => event.stopPropagation()} className="fixed bg-white opacity-100 p-5 rounded-md">
            <h3 className="font-medium text-2xl">Edit Asset</h3>
            <button onClick={closeModalEditHandler} className="absolute border font-bold text-gray-600 rounded-md px-1.5 right-1.5 top-1.5 hover:cursor-pointer hover:text-gray-500">X</button>
            <form onSubmit={saveAsset} className="mt-3">
              <div className="flex flex-col my-1">
                <label className="mb-1">Name</label>
                <input defaultValue={dataEdit.name} onChange={({target}) => inputEditHandler(target)} className="outline outline-gray-400 focus:outline-2 rounded-sm p-1" name="name-edit" type="text"/>
              </div>
              <div className="flex flex-col my-1">
                <label className="mb-1">Description</label>
                <input defaultValue={dataEdit.description} onChange={({target}) => inputEditHandler(target)} className="outline outline-gray-400 focus:outline-2 rounded-sm p-1" name="description-edit" type="text"/>
              </div>
              <div className="flex flex-col my-1">
                <label className="mb-1">Price</label>
                <div className="flex justify-between items-center">
                  <input defaultValue={dataEdit.price} onChange={({target}) => inputEditHandler(target)} className="outline outline-gray-400 focus:outline-2 rounded-sm p-1" name="price-edit" type="number" step="any"/>
                  <span className="text-gray-500 mx-1">ETH</span>
                </div>
              </div>
              <div className="flex items-center my-1">
                <input onChange={({target}) => inputEditHandler(target)} type="checkbox" name="forSale-edit" className="mr-1" defaultChecked={selectedAsset.forSale}/>
                <span>For Sale</span>
              </div>
              <div className="mt-2 flex justify-center">
                <button className="shadow-md text-white px-2 py-0.5 rounded-sm bg-sky-500 hover:cursor-pointer hover:bg-sky-400" type="submit">Save</button>
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
        <h1 className="text-3xl font-bold mb-2">NFT Asset Marketplace</h1>
        {
        isWalletConnect ? 
        <div className="flex flex-col lg:flex-row gap-2 lg:justify-end lg:items-center w-full">
          <p className="font-semibold overflow-hidden">Address: {currentAccount}</p>
          <button onClick={openModalMintHandler} className="text-sm px-3 bg-green-500 py-2 shadow-md text-white rounded-md hover:bg-green-400 hover:cursor-pointer">Mint Asset</button>
        </div>
        :
        <button onClick={connectWallet} className="border border-slate-500 px-2 text-sm font-semibold rounded-lg duration-100 bg-slate-300 hover:bg-slate-400 hover:cursor-pointer">Connect Wallet</button>
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
      {showAlert && <Alert type={alertType} message={message} onClose={closeAlert}/>}
      { isMintModalOpen && <ModalMint/> }
      { isEditModalOpen && <ModalEdit/> }
    </>
  );
}

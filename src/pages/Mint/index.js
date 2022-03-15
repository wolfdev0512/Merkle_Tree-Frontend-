import React, { useState, useEffect } from "react";
import {
  Layout,
  Container,
  Fieldset,
  Legend,
  InputBox,
  AddInput,
  AddButton,
  Root,
  List,
  ButtonBoxContainer,
  ButtonBox,
  Mint,
  WalletConnect,
} from "./style";
import { toast } from "react-toastify";
import axios from "axios";

import { useEthContext } from "../../context/EthereumContext";
import contract_abi from "../../contract/abi.json";
import { contract_address } from "../../contract/contract_address";

// "0x4C9625fB6a100A97748E185c49b9206Ee0175102",
// "0x8877865000DBDF8fc7ac255C9367e9007c6b8b1D",
// "0xdE2748D6137C3aA7E096FC164766ab9C112856b5",

const Dashboard = () => {
  console.log(contract_address);
  const [temp, setTemp] = useState("");
  const [root, setRoot] = useState();
  const [addresses, setAddresses] = useState([]);
  const [price, setPrice] = useState(0);
  const [owner, setOwner] = useState("");
  const { provider, currentAcc, web3 } = useEthContext();

  useEffect(() => {
    getInfo();
  });

  const getInfo = () => {
    const contract = new web3.eth.Contract(contract_abi, contract_address);
    contract.methods
      .owner()
      .call()
      .then((data) => {
        console.log(data);
        setOwner(data.toLowerCase());
      })
      .catch((e) => {
        console.log(e);
      });
    contract.methods
      .PUBLIC_WHITELIST_PRICE()
      .call()
      .then((data) => {
        setPrice(data);
      })
      .catch((e) => {
        console.log(e);
      });
  };

  const changeInput = (e) => {
    setTemp(e.target.value.toLowerCase());
  };

  const addList = () => {
    if (owner === currentAcc.toLocaleLowerCase()) {
      axios
        .get(`https://salty-inlet-19598.herokuapp.com/add/${temp}`)
        .then(async (res) => {
          const root = await res.data.root;
          if (root === "Address already exists") {
            alert("Address already exists");
          } else {
            await setRoot(root.toLowerCase());
            await setAddresses(res.data.addresses);
            const contract = new web3.eth.Contract(
              contract_abi,
              contract_address
            );

            await contract.methods
              .setMerkleRoot("0x" + root)
              .send({ from: currentAcc.toUpperCase(),}, (err, res) => {
                if (err) {
                  console.log("An error occured", err);
                  return;
                }
                console.log("Hash of the transaction: " + res);
              });
          }
        });
    } else {
      alert("Only owner can add");
    }
  };

  const getProof = async () => {
    return await axios
      .get(`https://salty-inlet-19598.herokuapp.com/get/${currentAcc}`)
      .then((res) => {
        console.log(res.data.proof);
        return res.data.proof;
      });
  };

  const handleConnectWallet = async () => {
    if (provider) {
      await provider.request({ method: `eth_requestAccounts` });
    } else {
      toast.error("Please install your Metamask wallet in this browser", {
        theme: "dark",
      });
    }
  };

  const mint = async () => {
    let proof = await getProof();
    const contract = new web3.eth.Contract(contract_abi, contract_address);
    console.log("sdfwef");
    contract.methods.whitelistMint(1, proof).send(
      {
        from: currentAcc,
        value: price,
      },
      (err, res) => {
        if (err) {
          console.log("An error occured", err);
          return;
        }
        console.log("Hash of the transaction: " + res);
      }
    );
  };

  return (
    <Layout>
      <Container>
        <Fieldset>
          <Legend>Owner: {owner}</Legend>
          <InputBox>
            <AddInput
              onChange={(e) => changeInput(e)}
              placeholder={"Add Address"}
            ></AddInput>
            <AddButton onClick={addList}>Add Whitelist</AddButton>
          </InputBox>
          {root && <Root>{"Root: " + root}</Root>}
          <List>
            <legend>WhiteList</legend>
            {addresses.map((item, index) => (
              <p key={index}>{item}</p>
            ))}
          </List>
        </Fieldset>
      </Container>
      <Container>
        <Fieldset>
          <Legend>WhiteList Mint:</Legend>
          <ButtonBoxContainer>
            <ButtonBox>
              <WalletConnect onClick={() => handleConnectWallet()}>
                {currentAcc ? currentAcc : "Connect Wallet"}
              </WalletConnect>
              <Mint onClick={mint}>WhitelistMint</Mint>
            </ButtonBox>
          </ButtonBoxContainer>
        </Fieldset>
      </Container>
    </Layout>
  );
};

export default Dashboard;

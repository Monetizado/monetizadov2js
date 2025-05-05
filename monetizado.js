const networks = {
	"polkadot:testnet" : "0x86f5304600627e7897AaAfAD39853e3D18E71B43",
}


const monetizadoAbi = [
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "cost",
				"type": "uint256"
			}
		],
		"name": "add",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "creator",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "sequenceId",
				"type": "uint256"
			}
		],
		"name": "getContent",
		"outputs": [
			{
				"components": [
					{
						"internalType": "string",
						"name": "name",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "cost",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "sequenceId",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "creator",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "amountAvailable",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "totalAmount",
						"type": "uint256"
					}
				],
				"internalType": "struct Monetizado.Content",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getContentsCreator",
		"outputs": [
			{
				"components": [
					{
						"internalType": "string",
						"name": "name",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "cost",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "sequenceId",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "creator",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "amountAvailable",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "totalAmount",
						"type": "uint256"
					}
				],
				"internalType": "struct Monetizado.Content[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "creator",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "sequenceId",
				"type": "uint256"
			}
		],
		"name": "hasAccess",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "creator",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "sequenceId",
				"type": "uint256"
			}
		],
		"name": "pay",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "sequenceId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "withdraw",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];



async function getContract(web3,contractNetwork, userAddress) {
    var contractPublic = await new web3.eth.Contract(monetizadoAbi,contractNetwork);
    if(userAddress != null && userAddress != undefined) {
      contractPublic.defaultAccount = userAddress;
    }
    return contractPublic;
  }

var iface = new ethers.utils.Interface(monetizadoAbi);

// Nombre de la nueva propiedad
const monetizadoProp = 'monetizado';


window[monetizadoProp] = {
    isPageEnabled : function() {
        const monetizationTag = document.querySelector('link[rel="monetizado"]');

        if (monetizationTag == null) {
            return false;
        }
        else {
            return true;
        }
    },
    validateNetworkFormat: function(networkFormat) {
        const parts = networkFormat.split("://");
        if(parts.length == 2) {
            if (networks.hasOwnProperty(parts[0])) {
                const subpartsCreator = parts[1].split("/");
                if(subpartsCreator.length == 2) {
                    return true;
                }
                else {
                    console.error("The content format is wrong. It should be:<creator address like 0x...>/<sequence Id for content>");
                    return false;
                }
            }
            else {
                console.error("The network doesn't exist for this Monetizado version");
                return false;
            }
        }else {
            console.error("Format error. It should be <network (polkadot)>:<type (mainnet/testnet)>://<creator address like 0x...>/<sequence Id for content>");
            return false;
        }
    },
    connectWeb3 : function(urlRPC) {
        return new Web3(new Web3.providers.HttpProvider(urlRPC));
    },
    userHasAccess: async function(Web3) {

        var accounts = await ethereum.request({method: 'eth_requestAccounts'});
        var account = accounts[0];
        
        const monetizationTag = document.querySelector('link[rel="monetizado"]');
        const parts = monetizationTag.href.split("://");

        const contractNetwork = networks[parts[0]];
        const creatorParts = parts[1].split("/");
        const creatorId = creatorParts[0];
        const sequenceId = creatorParts[1];

        var contractPublic = await getContract(Web3,contractNetwork,account);

        if(contractPublic != undefined) {
            var user = await ethereum
              .request({
                method: 'eth_call',
                params: [
                  {
                    from: account, // The user's active address.
                    data: contractPublic.methods.hasAccess(creatorId,sequenceId).encodeABI(),
                    to: contractNetwork
                  },
                ],
              });
              user = iface.decodeFunctionResult("hasAccess", user);
              return user[0];
          }
    },
    getContentInfo: async function(Web3){
        var accounts = await ethereum.request({method: 'eth_requestAccounts'});
        var account = accounts[0];
        
        const monetizationTag = document.querySelector('link[rel="monetizado"]');
        const parts = monetizationTag.href.split("://");

        const contractNetwork = networks[parts[0]];
        const creatorParts = parts[1].split("/");
        const creatorId = creatorParts[0];
        const sequenceId = creatorParts[1];

        var contractPublic = await getContract(Web3,contractNetwork,account);

        if(contractPublic != undefined) {
            var contentInfo = await ethereum
              .request({
                method: 'eth_call',
                params: [
                  {
                    from: account, // The user's active address.
                    data: contractPublic.methods.getContent(creatorId,sequenceId).encodeABI(),
                    to: contractNetwork
                  },
                ],
              });
              contentInfo = iface.decodeFunctionResult("getContent", contentInfo);
              if(contentInfo.length > 0) {
                return contentInfo[0];
              }
              return null;
          }
    },
	getAmountForWithdraw: async function(Web3){
        var accounts = await ethereum.request({method: 'eth_requestAccounts'});
        var account = accounts[0];
        
        const monetizationTag = document.querySelector('link[rel="monetizado"]');
        const parts = monetizationTag.href.split("://");

        const contractNetwork = networks[parts[0]];
        const creatorParts = parts[1].split("/");
        const creatorId = creatorParts[0];
        const sequenceId = creatorParts[1];

        var contractPublic = await getContract(Web3,contractNetwork,account);

        if(contractPublic != undefined) {
            var contentInfo = await ethereum
              .request({
                method: 'eth_call',
                params: [
                  {
                    from: account, // The user's active address.
                    data: contractPublic.methods.getContent(creatorId,sequenceId).encodeABI(),
                    to: contractNetwork
                  },
                ],
              });
              contentInfo = iface.decodeFunctionResult("getContent", contentInfo);
              if(contentInfo.length > 0) {
                return contentInfo[0].amountAvailable.toBigInt();
              }
              return null;
          }
    },
	getContentList: async function(Web3){
        var accounts = await ethereum.request({method: 'eth_requestAccounts'});
        var account = accounts[0];
        
        const monetizationTag = document.querySelector('link[rel="monetizado"]');
        const parts = monetizationTag.href.split("://");

        const contractNetwork = networks[parts[0]];

        var contractPublic = await getContract(Web3,contractNetwork,account);

        if(contractPublic != undefined) {
            var contentInfo = await ethereum
              .request({
                method: 'eth_call',
                params: [
                  {
                    from: account, // The user's active address.
                    data: contractPublic.methods.getContentsCreator().encodeABI(),
                    to: contractNetwork
                  },
                ],
              });
              contentInfo = iface.decodeFunctionResult("getContentsCreator", contentInfo);
              return contentInfo;
          }
    },
    payContent: async function(Web3,amount){
        var accounts = await ethereum.request({method: 'eth_requestAccounts'});
        var account = accounts[0];
        
        const monetizationTag = document.querySelector('link[rel="monetizado"]');
        const parts = monetizationTag.href.split("://");

		

        const contractNetwork = networks[parts[0]];

		const networkName = parts[0].split(':')[0];
        const creatorParts = parts[1].split("/");
        const creatorId = creatorParts[0];
        const sequenceId = creatorParts[1];


        var contractPublic = await getContract(Web3,contractNetwork,account);

        if(contractPublic != undefined) {
            const query = contractPublic.methods.pay(creatorId,sequenceId);
            const encodedABI = query.encodeABI();
            const gasPrice = Web3.utils.toHex(await Web3.eth.getGasPrice());

			const paramsForEIP1559 = { from: account, 
				to: contractNetwork,
				data: encodedABI,
				value: Web3.utils.numberToHex(amount),
				gasLimit: '0x5208'};

            var payContentId = await ethereum
            .request({
              method: 'eth_sendTransaction',
              params: [
                paramsForEIP1559
              ],
            });

            return payContentId;
          }
    },
    withdrawMoneyFromContent: async function(Web3,amount){
        var accounts = await ethereum.request({method: 'eth_requestAccounts'});
        var account = accounts[0];
        
        const monetizationTag = document.querySelector('link[rel="monetizado"]');
        const parts = monetizationTag.href.split("://");

		

        const contractNetwork = networks[parts[0]];

		const networkName = parts[0].split(':')[0];
        const creatorParts = parts[1].split("/");
        const creatorId = creatorParts[0];
        const sequenceId = creatorParts[1];


		if (creatorId == account) {
			var contractPublic = await getContract(Web3,contractNetwork,account);

			if(contractPublic != undefined) {
				const query = contractPublic.methods.withdraw(sequenceId,amount);
				const encodedABI = query.encodeABI();
				const gasPrice = Web3.utils.toHex(await Web3.eth.getGasPrice());

				const paramsForEIP1559 = { from: account, 
					to: contractNetwork,
					data: encodedABI,
					gasLimit: '0x5208'};

				var withdrawMoneyFromContentId = await ethereum
				.request({
				method: 'eth_sendTransaction',
				params: [
					paramsForEIP1559
				],
				});

				return withdrawMoneyFromContentId;
			}
		} else {
			console.error("You are not the owner of this creation");
		}
    }
}
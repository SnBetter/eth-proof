// design decisions
// main API should prove against a blockhash
// including *some* repetitive data. each array to be hashed will already include the
// hash from the previous step (in it). This will eliminate the need to inject the 
// previous hash into the array, and shift all the elements

// for solidity, should we send rlpObjects or arrays. former must be decoded, latter
// must be encoded. I think encoding is easier

// use a try catch for strictness (wont help much in evm tho)

// library has 2 main functions.
//   1- generating a proof (requires blockchain data)
//   2- checking a proof against a blockhash

// it should probably extend web3 methods to return a proof instead of just the data

sha3 = require('js-sha3').keccak_256
rlp = require('rlp');


EthVerify = () => {}

// The EthVerify public API checks proofs against a specified blockhash.
// Establishing trust of a blockhash is a separate issue. It relies on trust
// of a chain, which should ultimately rely on a set of heuristics involving
// expected total work at the current moment in time


//public methods all prove commitment to a blockhash
EthVerify.header = (prf, blockHash) => {
  try{
    return sha3(rlp.encode(prf.header)) == blockHash;
  }catch(e){ console.log(e) }
  return false
}

EthVerify.txsRoot = (prf, blockHash) => {//require prf.header
  try{
    if(EthVerify.header(prf, blockHash)){
      EthVerify._txsRoot(prf.header[4], prf.header);
    }
  }catch(e){ console.log(e) }
  return false
}

EthVerify.tx = (prf, blockHash) => {//require prf.header, prf.stack, prf.path, prf.tx
  if(EthVerify.txsRoot(prf, blockhash)){
    return EthVerify._tx(prf, prf.header[4])
  }
  return false;
}

//_private methods prove commitment to root of their immediate trie
EthVerify._txsRoot = (txsRoot, header) => {
  try{
    if(txsRoot == header[4]){
      return true;
    }
  }catch(e){ console.log(e) }
  return false
}


EthVerify._tx = (prf, txsRoot) => {
  try{
    var path = prf.path
    return EthVerify.value(path, prf.tx, txsRoot, prf.stack)
  }catch(e){ return false }
}

EthVerify.value = (path/*hexstring*/, value, root, stack) => {
  try{

    var currentNode;
    var len = stack.length;
    var rlpTxFromPrf = stack[len - 1][stack[len - 1].length - 1];
    
    var nodeKey = root;
    var pathPtr = 0;

    path = path.toString('hex')
    for (var i = 0 ; i < len ; i++) {
      currentNode = stack[i];
      if(!nodeKey.equals( new Buffer(sha3(rlp.encode(currentNode)),'hex'))){
        console.log("nodeKey != sha3(rlp.encode(currentNode)): ", nodeKey, new Buffer(sha3(rlp.encode(currentNode)),'hex'))
        return false;
      }
      if(pathPtr >= path.length){
        console.log("pathPtr >= path.length ", pathPtr,  path.length)
        return false
      }

      switch(currentNode.length){
        case 17://branch node
          if(pathPtr == path.length){
            if(currentNode[16] == rlp.encode(value)){
              return true;
            }else{
              console.log('currentNode[16],rlp.encode(value): ', currentNode[16], rlp.encode(value))
              return false
            }
          }
          nodeKey = currentNode[path[pathPtr]] //must == sha3(rlp.encode(currentNode[path[pathptr]]))
          pathPtr += 1
          break;
        case 2:
          pathPtr += nibblesToTraverse(currentNode[0].toString('hex'), path, pathPtr)
          if(pathPtr == path.length){//leaf node
            if(currentNode[1].equals(rlp.encode(value))){
              return true
            }else{
              console.log("currentNode[1] == rlp.encode(value) ", currentNode[1], rlp.encode(value))
              return false
            }
          }else{//extension node
            nodeKey = currentNode[1]
          }
          break;
        default:
          console.log("all nodes must be length 17 or 2");
          return false
      }
    }
  }catch(e){ console.log(e); return false }
  return false
}


nibblesToTraverse = (encodedPartialPath, path, pathPtr) => { 
  if(encodedPartialPath[0] == 0 || encodedPartialPath[0] == 2){
    var partialPath = encodedPartialPath.slice(2)
  }else{
    var partialPath = encodedPartialPath.slice(1)
  }

  if(partialPath == path.slice(pathPtr, pathPtr + partialPath.length)){
    return partialPath.length
  }else{
    throw new Error("path was wrong")
  }
}
// path = "abcdef0123456789"
// pathPtr = 2
// partialPath = "cde"

// moveRight = (str, numSpaces = 1) => {
//   if(numSpaces > str.length){ numSpaces = str.length}
//   return str.slice(0,str.length - numSpaces)
// }
// moveLeft = (str, numSpaces = 1) => {
//   if(numSpaces > str.length){ numSpaces = str.length}
//   return str.slice(0 + numSpaces, str.length)
// }

// nodeTypeof = (node) => {
//   if(node.length == 17){
//     return 'branch'
//   }else if(node.length == 2){ // probably dont need this check
//     if(node.toString('hex')[0] == 0 || node.toString('hex')[0] == 1){
//       return 'extension'
//     }else if(node.toString('hex')[0] == 2 || node.toString('hex')[0] == 3){
//       return 'leaf'
//     }else{
//       throw new Error('wrong node encoding:' + node.toString('hex')[0])
//     }
//   }else{
//     throw new Error('node is wrong length')
//   }
// }

// EthVerify.consumeHexSequence = (ptr, hexSequence) =>{

// }


// proveTransaction = (prf, blockHash) => {
//   proveHeader(prf.header blockHash)
  


//   return true
// }
// proveHeader = (blockHeader blockHash) => {
//   blockHeader.txsRoot
// }


// proveAccount = (proof, stateRoot) => {
//   return true
// }
// proveNonce = (proof, account) => {
//   return true
// }
// proveBalance = (proof, account) => {
//   return true
// }
// proveEVMCode = (proof, account) => {
//   return true
// }


// prove = (proof, root) => {

// }
// proveStorage = (proof, storageRoot) => {
//   return true
// }


// proveRLP = (RLPproof, root) => {
//   return true
// }

// rotateRight = (str, numSpaces = 1) => {
//   numSpaces %= str.length
//   return str.slice(str.length - numSpaces, str.length) + str.slice(0,str.length - numSpaces)
// }
// rotateLeft = (str, numSpaces = 1) => {
//   numSpaces %= str.length
//   return rotateRight (str, str.length - numSpaces)
// }



// nodeTypeOf = (node) => {
//   // if(partialPath > path){ return false }
//   if(node.length == 17){ return 'branch'}
//   if(node.length == 2){
//     if(node.raw[0])
//   }
//   if(partialPath == path.slice(path.length - partialPath.length)){
//     return partialPath - length
//   }
//   throw new Error("path was wrong")
// }


module.exports = EthVerify



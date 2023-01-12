# multiple-anchor-programs
This repository contains three solana programs (built using Anchor framework) as well as their respective tests code.  
  
* *__sol-transfer__* program deals with transfer of native SOLs from sender account to the receiver's account.  
* *__spl-transfer__* program deals with transfer of SPL tokens from sender's token account to the receiver's token account.  
* *__stream-withdraw-timelog__* program deals with the streaming and withdrawal of both native SOL and SPL tokens based on a timelog. This simply means that the withdrawal
part of the native and spl tokens works only if certain timespan has passed from the instance the stream was initiated.  
  
## Clone the repo  
```https://github.com/Niten619/multiple-anchor-programs.git```
  
## Install the packages  
```npm install```  

## Build the programs  
```anchor build```  
  
## Run individual anchor tests for individual programs  
```anchor run sol-test```  
```anchor run spl-test```  
```anchor run timelog-test```  
  
<sub>Note: Make sure your solana cli configs are set to devnet i.e. https://api.devnet.solana.com</sub>

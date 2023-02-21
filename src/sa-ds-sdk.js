import { Desktop } from '@wxcc-desktop/sdk';
//import { openCTI } from '../opencti_min.js';
import '../opencti_min.js';
const salesforceMCChannel = 'CallDetails__c';
const template = document.createElement('template');

// Roughly, 170 lines of Style. 50 lines of HTML.  145 lines of widget logic
template.innerHTML = `
  <style>
  .container{
    display:flex;
    align-items:left;
    justify-content:left;
    height: 100%;
    overflow: scroll;  
  }
  .card{
    height:380px;
    width:250px;
    margin:70px 10px;
    cursor:pointer;
    border-radius:10px;
    background-color:#EDEDED;
  }
  .results {
    min-height:200px;
    width:600px;
    margin:15px 5px;
    padding:1rem;
    cursor:pointer;
    border-radius:10px;
    background-color:white;
  }
  .card img{
    margin: 0;
    width:100%;
    height:160px;
    border-top-right-radius:10px;
    border-top-left-radius:10px;
    position:relative;
    z-index:1000;
    transition:all .5s ease-in-out;
    box-shadow: 0px 10px 25px -7px rgba(28,27,28,1);
  }
  .card__content{
    margin:1rem 0;
    color:#222;
    overflow:hidden;
    margin-top:-200px;
    opacity:0;
    visibility:hidden;
    transition:all .5s ease-in-out;
  }
  .card__content h3{
    margin:.6rem auto;
    text-align:center;
  }
  .card__content p{
    font-size:1.1rem;
    line-height:1.8rem;
    text-align:center;
  }
  .card__content a{
    width:200px;
    padding:10px 15px;
    display:block;
    text-align:center;
    margin:.6rem auto;
    font-size:1.1rem;
    color:#DEDEDE;
    text-decoration:none;
    background-color:#064157;
    border-radius:10px;
    transition:.3s;
  }
  .card__content a#ready:hover{
    color:#fff;
    background-color:#00853C;
  }
  .card__content a#not:hover{
    color:#fff;
    background-color:#FC9D03;
  }
  .card__content a#transfer:hover{
    color:#fff;
    background-color:#007AA3;
  }
  .card:hover img{
    margin-top:-60px;
  }
  .card:hover>.card__content{
    margin-top:0;
    opacity:1;
    visibility:visible;
  }
  #info {
    font-family: Arial, Helvetica, sans-serif;
    border-collapse: collapse;
    width: 100%;
  }
  #info td,  info th {
    border-bottom: 1px solid #ddd;
    padding: 4px;
  }
  
  #info th {
    padding-top: 12px;
    padding-bottom: 12px;
    padding-left: 12px;
    text-align: left;
    background-color: #064157;
    color: white;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
  }
  #info th.value {
    background-color:  #007AA3;
  }
  .outline {
    margin-bottom: 25px;
    padding: 12px;
  }
  p.carrot{
    margin-top: 5px;
    text-align: center;
    font-size: 14px;
  }
  #makeCallButton{
    display: block;
    border-radius: 5px;
    background: #064157;
    color: white;
    padding: 4px;
    margin-top: 10px;
    width: 100%;
    border: none;
    transition:.3s;
  }
  #makeCallButton:hover{
    color:#fff;
    background-color:#007AA3;
  }
  input{
    border-top: none;
    border-right: none;
    border-left: none;
    border-color: #DDDDDD;
    border-width: 1.5px;
    color: #005E7D
  }
  *:focus {
    outline: none;
  }
  fieldset{
    border-radius: 5px;
  }
  .atr{
    color: #899499;
  }
  .val{
    color: #005E7D;
    font-weight: bold;
  }
  table#info{
    border-bottom:  solid ;
  }
  td#accessToken.val{
    max-width: 380px;
    max-height: 30px;
    white-space: nowrap;
    overflow: scroll;
  }

  #credit{
    letter-spacing: 3px;
    margin-left: 25px;
    width: 190px;
  }

  ::placeholder {
    color: #899499;
    opacity: 0.5; /* Firefox */
  }
  .icon{
    font-size: 18px;
    margin-left: 25px;
  }
  
  -webkit-box-shadow: 0px 10px 25px -7px rgba(28,27,28,1);
  -moz-box-shadow: 0px 10px 25px -7px rgba(28,27,28,1);

  @media screen and (max-width:400px){
    .container{
      flex-wrap:wrap;
    }
  }
  </style>

  <div class="container">
          <div class="card results">
            <table id="info">
                <tr>
                  <th>Attribute</th>
                  <th class="value">Value</th>
                </tr>
                <tr>
                  <td class="atr">Agent Name:</td>
                  <td class="val" id="userId"></td>
                </tr>
                <tr>
                  <td class="atr">Agent State:</td>
                  <td class="val" id= "userState"></td>
                </tr>
                <tr>
                  <td class="atr">Agent Session ID:</td>
                  <td class="val" id="sessionId"></td>
                </tr>
                <tr>
                  <td class="atr">Agent Profile ID:</td>
                  <td class="val" id="profileId"></td>
                </tr>
                <tr>
                  <td class="atr">Team:</td>
                  <td class="val" id="teamName"></td>
                </tr>
                <tr>
                  <td class="atr">Locale:</td>
                  <td class="val" id="locale"></td>
                </tr>
                <tr>
                  <td class="atr">$STORE: accessToken</td>
                  <td class="val" id="accessToken"></td>
                </tr>
                <tr>
                  <td class="atr">DNIS:</td>
                  <td class="val" id="dnis"></td>
                </tr>
                <tr>
                  <td class="atr">Interaction Data:</td>
                  <td class="val" id="interactionData"></td>
                </tr>
                <tr>
                  <td class="atr">Call Data:</td>
                  <td class="val" id="callData"></td>
                </tr>
              </table>
  </div>
`;

//Creating a custom logger
const logger = Desktop.logger.createLogger('sdk-widget-logger');

class DesktopSDKSample extends HTMLElement {
  state = {
    defaultAuxCode: 0,
  };

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.interactionId = null;
  }

  connectedCallback() {
    this.init();
    this.subscribeAgentContactDataEvents();
    this.getAgentInfo();
    this.publishSampleMC();
  }

  subscribeToSalesforceMC(){
    sforce.opencti.subscribe({channelName: salesforceMCChannel, listener: onPublishMessage, callback: subscribeSampleMCCallback});
  }
  onPublishMessage(message) {
    console.log('*****Salesforce message received: '+ message);
  }
  subscribeSampleMCCallback(result) {
    if (result.success) {
      console.log('*****Subscription: '+ result.subscription);
    } else {
      console.log('*****Subscription_errors: '+ result.errors);
    }
  }
  publishSampleMC() {
    const message = {
      from: "LightningMessageService_OpenCTI_TestPage",
      type: "INBOUND",
      payload: 'test',
      time: new Date().toLocaleTimeString()
    };
    console.log('**** sending message to salesforce **** ');
    sforce.opencti.publish({channelName: salesforceMCChannel, message: message, callback: lightningMessageServiceCallback});
  }
  lightningMessageServiceCallback(result) {
    if (result.success) {
      console.log('*****MCcallback: ' + result.returnValue);
    } else {
      console.log('*****MCcallback_error: ' + result.errors);
    }
  }
  disconnectedCallback() {
    // alert("remove some functions...")
    Desktop.agentContact.removeAllEventListeners();
  }

  async init() {
    // Initiating desktop config
    Desktop.config.init();
    // Traverse Shadow DOM and map to corresponding fields:
    this.shadowRoot.querySelector('#userState').innerHTML =
      Desktop.agentStateInfo.latestData.subStatus;
    this.shadowRoot.querySelector('#teamName').innerHTML =
      Desktop.agentStateInfo.latestData.teamName;
    this.shadowRoot.querySelector('#profileId').innerHTML =
      Desktop.agentStateInfo.latestData.agentProfileID;
    this.shadowRoot.querySelector('#sessionId').innerHTML =
      Desktop.agentStateInfo.latestData.agentSessionId;
    this.shadowRoot.querySelector('#userId').innerHTML =
      Desktop.agentStateInfo.latestData.agentName;
    this.shadowRoot.querySelector('#locale').innerHTML =
      Desktop.config.clientLocale;
    this.shadowRoot.querySelector('#accessToken').innerHTML = this.accessToken;

 

    // Get the outDial ANI
    let outDialOrigin = await Desktop.agentStateInfo.mockOutdialAniList();
    outDialOrigin.data.data.mockOutdialAniList[0].id;

    // Searching for default unavailable code in list of unavailable codes.
    let i = 0;
    logger.info('*****Collecting Idle Code length..');
    const auxCount = Desktop.agentStateInfo.latestData.idleCodes.length;
    while (i <= auxCount - 1) {
      logger.info(
        '*****AuxCode list ',
        Desktop.agentStateInfo.latestData.idleCodes[i].id
      );

      if (Desktop.agentStateInfo.latestData.idleCodes[i].isDefault == true) {
        this.state.defaultAuxCode =
          Desktop.agentStateInfo.latestData.idleCodes[i].id;
        logger.info('*****default aux found ', this.state.defaultAuxCode);
        break;
      }
      i++;
    }
  }

  // Sample function to print latest data of agent
  getAgentInfo() {
    const latestData = Desktop.agentStateInfo.latestData;
    logger.info('*****myLatestData', latestData);
  }

  // Get interactionID, but more info can be obtained from this method
  async getInfo() {
    logger.info('*****Getting Task Information..');
    const currentTaskMap = await Desktop.actions.getTaskMap();

    logger.info('*****Fetched: ' + JSON.stringify(currentTaskMap));
    for (const iterator of currentTaskMap) {
      const interId = iterator[1].interactionId;
      return interId;
    }
  }
  // Get interactionID, but more info can be obtained from this method
  async getMap() {
    logger.info('*****Getting Task Map Information..');
    const currentTaskMap = await Desktop.actions.getTaskMap();

    for (const iterator of currentTaskMap) {
      const interId = iterator[1];
      return interId;
    }
  }

  // Initiate a transfer
  async transferToEP() {
    let interactionId = await this.getInfo();
    let response = await Desktop.agentContact.vteamTransfer({
      interactionId,
      data: {
        vteamId: 'AXr39XRQDntNus7_q4r8', // replace with your onw Queue
        vteamType: 'inboundqueue',
      },
    });

    logger.info('*****myTransfer' + JSON.stringify(response));
  }

  // Pause Recording
  async pauseRecord() {
    let interactionId = await this.getInfo();
    await Desktop.agentContact.pauseRecording({
      interactionId,
    });
  }

  // Get DialOut form input fields
  inputElement(name) {
    return this.shadowRoot.getElementById(name);
  }

  // Function for making outDial call
  async makeCall(entryPointId, destination) {
    try {
      const outDial = await Desktop.dialer.startOutdial({
        data: {
          entryPointId,
          destination,
          direction: 'OUTBOUND',
          origin: this.outDialOrigin,
          attributes: {},
          mediaType: 'telephony',
          outboundType: 'OUTDIAL',
        },
      });
      logger.info('myOutDial' + JSON.stringify(outDial));
    } catch (error) {
      Desktop.dialer.addEventListener('eOutdialFailed', (msg) =>
        logger.info(msg)
      );
    }
  }

  // Function to update CAD variable. accountId is Local, PrimaryNumber is Global.
  // The payload to update the variables such as accountId and PrimaryNumber need to be defined inside of the flow.
  async updateCadVariable() {
    try {
      let interactionId = await this.getInfo();
      logger.info('*****Got Interaction: ' + interactionId);

      const cadVarsUpdated = await Desktop.dialer.updateCadVariables({
        interactionId: interactionId,
        data: {
          attributes: {
            accountId: '16910000',
            PrimaryNumber: '2894420000',
          },
        },
      });
      logger.info('*****CadVarsUpdated: ' + JSON.stringify(cadVarsUpdated));
    } catch (error) {
      logger.error('*****Error While Updating CAD Variables: ' + error);
    }
  }

  // Function to change the state on button click
  async changeState(state) {
    switch (state) {
      case 'Available':
        const agentState = await Desktop.agentStateInfo.stateChange({
          state,
          auxCodeIdArray: '0',
        });
        this.shadowRoot.querySelector('#userState').style.color = '#00AB50';
        logger.info('*****State Changed', agentState);
        break;
      case 'Idle':
        const agentState1 = await Desktop.agentStateInfo.stateChange({
          state,
          auxCodeIdArray: this.state.defaultAuxCode,
        });
        this.shadowRoot.querySelector('#userState').style.color = '#FC9D03';
        logger.info('*****State Changed to Idle', this.state.defaultAuxCode);
        break;
      default:
    }
    this.shadowRoot.querySelector('#userState').innerHTML =
      Desktop.agentStateInfo.latestData.subStatus;
  }

  // Subscribing to Agent contact event
  subscribeAgentContactDataEvents() {
    //Listofavailableagent-contactaqmnotifsevents:
    Desktop.agentContact.addEventListener("eAgentContact",msg=>console.log('*****eAgentContact: '+ JSON.stringify(msg)));
    Desktop.agentContact.addEventListener("eAgentContactAssigned",msg=>console.log('*****eAgentContactAssigned: '+ JSON.stringify(msg)));
    Desktop.agentContact.addEventListener("eAgentContactEnded",msg=>console.log('*****eAgentContactEnded: '+ JSON.stringify(msg)));
    Desktop.agentContact.addEventListener("eAgentContactWrappedUp",msg=>console.log('*****eAgentContactWrappedUp: '+ JSON.stringify(msg)));
    Desktop.agentContact.addEventListener("eAgentOfferContact",msg=>console.log('*****eAgentOfferContact: '+ JSON.stringify(msg)));
    Desktop.agentContact.addEventListener("eAgentOfferContactRona",msg=>console.log('*****eAgentOfferContactRona: '+ JSON.stringify(msg)));
    Desktop.agentContact.addEventListener("eAgentOfferConsult",msg=>console.log('*****eAgentOfferConsult: '+ JSON.stringify(msg)));
    Desktop.agentContact.addEventListener("eAgentWrapup",msg=>console.log('*****eAgentWrapup: '+ JSON.stringify(msg)));
    Desktop.agentContact.addEventListener("eAgentContactHeld",msg=>console.log('*****eAgentContactHeld: '+ JSON.stringify(msg)));
    Desktop.agentContact.addEventListener("eAgentContactUnHeld",msg=>console.log('*****eAgentContactUnHeld: '+ JSON.stringify(msg)));
    Desktop.agentContact.addEventListener("eCallRecordingStarted",msg=>console.log('*****eCallRecordingStarted: '+ JSON.stringify(msg)));
    Desktop.agentContact.addEventListener("eAgentConsultCreated",msg=>console.log('*****eAgentConsultCreated: '+ JSON.stringify(msg)));
    Desktop.agentContact.addEventListener("eAgentConsultConferenced",msg=>console.log('*****eAgentConsultConferenced: '+ JSON.stringify(msg)));
    Desktop.agentContact.addEventListener("eAgentConsultEnded",msg=>console.log('*****eAgentConsultEnded: '+ JSON.stringify(msg)));
    Desktop.agentContact.addEventListener("eAgentCtqCancelled",msg=>console.log('*****eAgentCtqCancelled: '+ JSON.stringify(msg)));
    Desktop.agentContact.addEventListener("eAgentConsulting",msg=>console.log('*****eAgentConsulting: '+ JSON.stringify(msg)));
    Desktop.agentContact.addEventListener("eAgentConsultFailed",msg=>console.log('*****eAgentConsultFailed: '+ JSON.stringify(msg)));
    Desktop.agentContact.addEventListener("eAgentConsultEndFailed",msg=>console.log('*****eAgentConsultEndFailed: '+ JSON.stringify(msg)));
    Desktop.agentContact.addEventListener("eAgentCtqFailed",msg=>console.log('*****eAgentCtqFailed: '+ JSON.stringify(msg)));
    Desktop.agentContact.addEventListener("eAgentCtqCancelFailed",msg=>console.log('*****eAgentCtqCancelFailed: '+ JSON.stringify(msg)));
    Desktop.agentContact.addEventListener("eAgentConsultConferenceEndFailed",msg=>console.log('*****eAgentConsultConferenceEndFailed: '+ JSON.stringify(msg)));
    
    // Desktop.agentContact.addEventListener('eAgentWrapup', (msg) => {
    //   logger.info('*****myAgentWrapup', JSON.stringify(msg));
    //   this.shadowRoot.querySelector('#callData').innerHTML = msg.data;
    //   this.shadowRoot.querySelector('#interactionData').innerHTML = msg.data.interaction;
    //   this.dnis = msg.data.interaction.callProcessingDetails.dnis;
    //   // another event thats just dipping into data...
    //   this.shadowRoot.querySelector('#dnis').innerHTML = this.dnis;
    //   // You can pull the ani from a few places including interaction/callAssociatedDetails/ani.  Below is using the Participants object.
    //   let participant = msg.data.interaction.participants;
    //   this.shadowRoot.querySelector('#destination').value =
    //     Object.entries(participant)[0][0];
    //   // Get outDial EP from $STORE
    //   this.shadowRoot.querySelector('#entryPointId').value = this.outdialEp;
    // });
    // Desktop.agentContact.addEventListener('eAgentContactHeld', (msg) => {
    //   logger.info('*****myAgentContactHeld', msg);
    //   this.shadowRoot.querySelector('#callData').innerHTML = msg.data;
    //   this.shadowRoot.querySelector('#interactionData').innerHTML = msg.data.interaction;
    // });
    // Desktop.agentContact.addEventListener('eAgentContactUnHeld', (msg) => {
    //   logger.info('*****myAgentContactUnHeld', msg);
    //   this.shadowRoot.querySelector('#callData').innerHTML = msg.data;
    //   this.shadowRoot.querySelector('#interactionData').innerHTML = msg.data.interaction;
    // });
  }
  // Dealing with DarkMode
  attributeChangedCallback(attrName, oldVal, newVal) {
    if (attrName === 'darkmode') {
      const darkMode = this.getAttribute('darkmode');
      if (darkMode === 'true') {
        const dark = this.shadowRoot.querySelector('.card.results');
        dark.style.background = '#000';
        dark.style.color = '#fff';
        Array.from(this.shadowRoot.querySelectorAll('input')).forEach((e) => {
          e.style.background = '#000';
        });
        Array.from(this.shadowRoot.querySelectorAll('.val')).forEach((e) => {
          e.style.color = '#fff';
        });
        const cardDark = this.shadowRoot.querySelector('.card');
        cardDark.style.background = '#000';
        cardDark.style.color = '#fff';
        let h3Dark = this.shadowRoot.querySelector('h3');
        h3Dark.style.color = '#fff';
      } else {
        Array.from(this.shadowRoot.querySelectorAll('input')).forEach((e) => {
          e.style.background = '#fff';
        });
        Array.from(this.shadowRoot.querySelectorAll('.val')).forEach((e) => {
          e.style.color = '#005E7D';
        });
        const light = this.shadowRoot.querySelector('.card.results');
        light.style.background = '#fff';
        light.style.color = '#000';
        const cardLight = this.shadowRoot.querySelector('.card');
        cardLight.style.background = '#EDEDED';
        cardLight.style.color = '#000';
        const h3Light = this.shadowRoot.querySelector('h3');
        h3Light.style.color = '#000';
      }
    }
  }
  static get observedAttributes() {
    return ['darkmode'];
  }
}

customElements.define('sa-ds-sdk', DesktopSDKSample);

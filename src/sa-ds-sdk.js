import { Desktop } from '@wxcc-desktop/sdk';
import '../opencti_min.js';
const salesforceMCChannel = 'CallDetails__c';
const template = document.createElement('template');

//Creating a custom logger
const logger = Desktop.logger.createLogger('sdk-widget-logger');

class DesktopSDKSample extends HTMLElement {
  state = {
    defaultAuxCode: 0,
  };

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.interactionId = null;
  }

  connectedCallback() {
    this.init();
    this.subscribeAgentContactDataEvents();
    this.getAgentInfo();
    this.publishSampleMC();
  }

  subscribeToSalesforceMC(){
    console.log('***subscribeToSalesforceMC*** '+ salesforceMCChannel);
    sforce.opencti.subscribe({channelName: salesforceMCChannel, listener: onPublishMessage, callback: subscribeSampleMCCallback});
  }
  onPublishMessage(message) {
    console.log('*****Salesforce message received: '+ message);
  }
  subscribeSampleMCCallback(result) {
    console.log('***lightningMessageServiceCallback***'+JSON.stringify(result));
    if (result.success) {
      console.log('*****Subscription: '+ result.subscription);
    } else {
      console.log('*****Subscription_errors: '+ result.errors);
    }
  }
  publishSampleMC(payload) {
    console.log('***publishSampleMC - Method called');
    const message = {
      from: "LightningMessageService_OpenCTI_TestPage",
      type: "INBOUND",
      payload: payload ? payload : 'test',
      time: new Date().toLocaleTimeString()
    };
    console.log('**** sending message to salesforce **** ');
    sforce.opencti.publish({channelName: salesforceMCChannel, message: message});
    
  }
  lightningMessageServiceCallback(result) {
    console.log('***lightningMessageServiceCallback***'+JSON.stringify(result));
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
    this.publishSampleMC(latestData);
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

  // Subscribing to Agent contact event
  subscribeAgentContactDataEvents() {
    //Listofavailableagent-contactaqmnotifsevents:
    Desktop.agentContact.addEventListener("eAgentContact",msg=>console.log('*****eAgentContact: '+ JSON.stringify(msg)));
    Desktop.agentContact.addEventListener("eAgentContactAssigned",msg=>console.log('*****eAgentContactAssigned: '+ JSON.stringify(msg)));
    Desktop.agentContact.addEventListener("eAgentContactEnded",msg=>console.log('*****eAgentContactEnded: '+ JSON.stringify(msg)));
    Desktop.agentContact.addEventListener("eAgentContactWrappedUp",msg=>console.log('*****eAgentContactWrappedUp: '+ JSON.stringify(msg)));
    Desktop.agentContact.addEventListener("eAgentOfferContact",msg=>{
      console.log('*****eAgentOfferContact: '+ JSON.stringify(msg));
      this.publishSampleMC(JSON.stringify(msg));
    });
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
  }
}

customElements.define('sa-ds-sdk', DesktopSDKSample);

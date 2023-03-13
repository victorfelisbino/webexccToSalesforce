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
  }

  subscribeToSalesforceMC(){
    console.log('***subscribeToSalesforceMC*** '+ this.salesforceMCChannel);
    sforce.opencti.subscribe({channelName: this.salesforceMCChannel, listener: onPublishMessage, callback: subscribeSampleMCCallback});
  }

  onPublishMessage(message) {
    console.log('*****Salesforce message received: '+ message);
  }

  subscribeCallback(result) {
    console.log('***subscribeCallback***'+JSON.stringify(result));
    if (result.success) {
      console.log('*****Subscription: '+ result.subscription);
    } else {
      console.log('*****Subscription_errors: '+ result.errors);
    }
  }

  publishToSalesforce(payload){
    this.callApexClass(payload);
    this.publishMC(payload);
  }

  publishMC(payload) {
    //console.log('***publishMC - Method called');
    const message = {
      from: "LightningMessageService_OpenCTI_TestPage",
      type: "INBOUND",
      payload: payload ? payload : 'test',
      time: new Date().toLocaleTimeString()
    };
    //console.log('**** sending message to salesforce **** ');
    sforce.opencti.publish({channelName: salesforceMCChannel, message: message});
  }

  callApexClass(payload) {
    console.log('**** calling apex class **** ');
    console.log('*** payload to salesforce: ' + payload);
    console.log(payload);
    let param = {
      apexClass: 'callHandler',
      methodName: 'newEvent',
      methodParams: 'eventData=' + JSON.stringify(payload),
    };
    param.callback = response => {
      this.serviceCallback(response);
    }
    sforce.opencti.runApex(param);
  }

  serviceCallback(result) {
    if (result.success) {
      let returnedValue = result.returnValue;
      let apexResults = JSON.parse(returnedValue.runApex);
      if(apexResults.type === 'CaseId'){
        console.log('*** POP CASE: Message:' + apexResults.message +' | Value: '+ apexResults.value);
        sforce.opencti.screenPop({type: sforce.opencti.SCREENPOP_TYPE.SOBJECT, params : {recordId: apexResults.value}});
      }else if(apexResults.type === 'CustomTab'){
        console.log('*** POP TAB: Message:' + apexResults.message +' | Value: '+ apexResults.value);
        sforce.opencti.screenPop({type: sforce.opencti.SCREENPOP_TYPE.URL, params : {url: '#/n/'+apexResults.value}});
      }else{
        console.log('*** type not found: ' + apexResults.type + ' | Message:' + apexResults.message +' | Value: '+ apexResults.value);
      }

    } else {
      console.log('*****callback_error: ' + JSON.stringify(result.errors));
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
    // let i = 0;
    // logger.info('*****Collecting Idle Code length..');
    // const auxCount = Desktop.agentStateInfo.latestData.idleCodes.length;
    // while (i <= auxCount - 1) {
    //   logger.info(
    //     '*****AuxCode list ',
    //     Desktop.agentStateInfo.latestData.idleCodes[i].id
    //   );

    //   if (Desktop.agentStateInfo.latestData.idleCodes[i].isDefault == true) {
    //     this.state.defaultAuxCode =
    //       Desktop.agentStateInfo.latestData.idleCodes[i].id;
    //     logger.info('*****default aux found ', this.state.defaultAuxCode);
    //     break;
    //   }
    //   i++;
    // }
  }

  // Sample function to print latest data of agent
  getAgentInfo() {
    const latestData = Desktop.agentStateInfo.latestData;
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
    Desktop.agentContact.addEventListener("eAgentContact",msg=>{
      console.log('*****eAgentContact*****');
      this.publishToSalesforce(msg);
    });
    Desktop.agentContact.addEventListener("eAgentContactAssigned",msg=>{
      console.log('*****eAgentContactAssigned*****');
      this.publishToSalesforce(msg);
    });
    Desktop.agentContact.addEventListener("eAgentContactEnded",msg=>{
      console.log('*****eAgentContactEnded*****');
      this.publishToSalesforce(msg);
    });
    Desktop.agentContact.addEventListener("eAgentContactWrappedUp",msg=>{
      console.log('*****eAgentContactWrappedUp*****');
      this.publishToSalesforce(msg);
    });
    Desktop.agentContact.addEventListener("eAgentOfferContact",msg=>{
      console.log('*****eAgentOfferContact*****');
      this.publishToSalesforce(msg);
    });
    Desktop.agentContact.addEventListener("eAgentOfferContactRona",msg=>{
      console.log('*****eAgentOfferContactRona*****');
      this.publishToSalesforce(msg);
    });
    Desktop.agentContact.addEventListener("eAgentOfferConsult",msg=>{
      console.log('*****eAgentOfferConsult*****');
      this.publishToSalesforce(msg);
    });
    Desktop.agentContact.addEventListener("eAgentWrapup",msg=>{
      console.log('*****eAgentWrapup*****');
      this.publishToSalesforce(msg);
    });
    Desktop.agentContact.addEventListener("eAgentContactHeld",msg=>{
      console.log('*****eAgentContactHeld*****');
      this.publishToSalesforce(msg);
    });
    Desktop.agentContact.addEventListener("eAgentContactUnHeld",msg=>{
      console.log('*****eAgentContactUnHeld*****');
      this.publishToSalesforce(msg);
    });
    Desktop.agentContact.addEventListener("eCallRecordingStarted",msg=>{
      console.log('*****eCallRecordingStarted*****');
      this.publishToSalesforce(msg);
    });
    Desktop.agentContact.addEventListener("eAgentConsultCreated",msg=>{
      console.log('*****eAgentConsultCreated*****');
      this.publishToSalesforce(msg);
    });
    Desktop.agentContact.addEventListener("eAgentConsultConferenced",msg=>{
      console.log('*****eAgentConsultConferenced*****');
      this.publishToSalesforce(msg);
    });
    Desktop.agentContact.addEventListener("eAgentConsultEnded",msg=>{
      console.log('*****eAgentConsultEnded*****');
      this.publishToSalesforce(msg);
    });
    Desktop.agentContact.addEventListener("eAgentCtqCancelled",msg=>{
      console.log('*****eAgentCtqCancelled*****');
      this.publishToSalesforce(msg);
    });
    Desktop.agentContact.addEventListener("eAgentConsulting",msg=>{
      console.log('*****eAgentConsulting*****');
      this.publishToSalesforce(msg);
    });
    Desktop.agentContact.addEventListener("eAgentConsultFailed",msg=>{
      console.log('*****eAgentConsultFailed*****');
      this.publishToSalesforce(msg);
    });
    Desktop.agentContact.addEventListener("eAgentConsultEndFailed",msg=>{
      console.log('*****eAgentConsultEndFailed*****');
      this.publishToSalesforce(msg);
    });
    Desktop.agentContact.addEventListener("eAgentCtqFailed",msg=>{
      console.log('*****eAgentCtqFailed*****');
      this.publishToSalesforce(msg);
    });
    Desktop.agentContact.addEventListener("eAgentCtqCancelFailed",msg=>{
      console.log('*****eAgentCtqCancelFailed*****');
      this.publishToSalesforce(msg);
    });
    Desktop.agentContact.addEventListener("eAgentConsultConferenceEndFailed",msg=>{
      console.log('*****eAgentConsultConferenceEndFailed*****');
      this.publishToSalesforce(msg);
    });
  }
}

customElements.define('SFEventsWidget', DesktopSDKSample);

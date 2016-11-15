
class CleanCall {
    constructor (session, moment, storage, $rootScope, $window, $state, $interval) {

        this.session = session;
        this.$rootScope = $rootScope;
        this.JsSIP = $window.JsSIP;
        this.moment = moment;

        this.localStream = null;
        this.type =  this.session.direction === "incoming"? 'IN':'OUT';
        this.id = this.session.id;
        this.target = this.session.remote_identity.uri.user;
        this.username = this.session.remote_identity.display_name || '';
        this.muted = false;
        this.date = moment().format('DD/MM/YYYY HH:mm:ss');



        this.status = 'ringing';
        this.duration = '';

        session.on('connecting', (e) => this.onConnecting(e));
        session.on('progress', (e) => this.onProgress(e));
        session.on('accepted', (e) => this.onAccepted(e));
        session.on('failed', (e) => this.onFailed(e));
        session.on('newDTMF', (e) => this.onDTMF(e));
        session.on('hold', (e) => this.onHold(e));
        session.on('unhold', (e) => this.onUnhold(e));
        session.on('ended', (e) => this.onEnded(e));
        session.on('update', (e) => this.onUpdate(e));
        session.on('addstream', (e) => this.onStreamAdded(e));

        if (this.type === 'IN') {
            $state.go('calls');
        }

        this.notifyUI();

    }


    onConnecting () {

        if (this.session.connection.getLocalStreams().length > 0) {
          this.localStream = this.session.connection.getLocalStreams()[0];
        }

    }
    onProgress () {

    }

    onAccepted (e) {

        this.status = 'active';
        this.notifyUI();

        if (this.session.connection.getLocalStreams().length > 0) {
          this.localStream = this.session.connection.getLocalStreams()[0];
        }

        if (e.originator === 'remote') {
          if (e.response.getHeader('X-Can-Renegotiate') === 'false') {
            this.session.data.remoteCanRenegotiateRTC = false;
          }
          else {
            this.session.data.remoteCanRenegotiateRTC = true;
          }
        }

        this.date = moment(this.session.start_time).format('DD/MM/YYYY HH:mm:ss');

    }

    onStreamAdded (e) {

        var remoteView = document.getElementById('remoteView');
        remoteView = this.JsSIP.rtcninja.attachMediaStream(remoteView, e.stream);

    }

    onDTMF () {

    }

    onHold()  {
        this.status = 'paused';
        this.notifyUI();
    }

    onUnhold()  {
        this.status = 'active';
        this.notifyUI();
    }

    onEnded (e) {

        this.status = 'finished';
        var startTime = this.moment(this.session.start_time);
        var endTime = this.moment(this.session.end_time);

        var duration = this.moment.duration(endTime.diff(startTime));

        this.duration = this.moment.utc(duration.asMilliseconds()).format("mm:ss");

        this.notifyUI();
        this.JsSIP.rtcninja.closeMediaStream(this.localStream);

    }

    onUpdate () {
        this.status = 'finished';
        this.notifyUI();
    }

    onFailed () {

        this.status = 'finished';
        this.notifyUI();
    }

    hangup () {
        this.session.terminate();
    }

    answer () {
        this.session.answer();
    }

    hold () {
        this.session.hold();
    }

    unhold () {
        this.session.unhold();
    }

    mute () {
        this.muted = true;
        this.session.mute();
    }

    unmute () {
        this.muted = false;
        this.session.unmute();
    }

    getDisplayTarget () {
        if (this.username !== '') {
            return this.username + ' (' + this.target + ')';
        } else {
            return this.target;
        }
    }

    notifyUI () {
        this.$rootScope.$broadcast('callsUpdated');
    }

}

export class CallService {
  constructor ($rootScope, localStorageService, moment, $window, $state, $interval) {
    'ngInject';
    this.moment = moment;
    this.storage = localStorageService
    this.$rootScope = $rootScope;
    this.$window = $window;
    this.$state = $state;
    this.$interval = $interval;

  }

  factory(session) {
  	return new CleanCall(session, this.moment, this.storage, this.$rootScope, this.$window, this.$state, this.$interval);
  }

}

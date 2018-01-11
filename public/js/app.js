/********************************************
 * Initialize
 */

$(document).foundation();  // necessary for Foundation scripts
$(document).ready(() => {

    /* Determine current page */
    if (window.location.href.indexOf("/thanks") > 0) {
        init.thanks();
    }

    if (window.location.href.indexOf("/play") > 0) {
        init.play();
    }

    /* JQUERY EVENT LISTENERS */
    // Record Page
    $("#record").on('click', handle.recordButton);
    $("#reset").on('click', handle.reset);
    $("form").submit(function (e) {
        e.preventDefault();
    });
    $("input").change(handle.inputChange);
    $("select").change(handle.formChange);
    $("#upload-pic").on('click', () => {
        $('#pic').click();
    });
    $("#pic").change(handle.picSelect);
    $("#upload-btn").on('click', handle.upload);

    // Play Page
    $("#back").on('click', () => {
        window.history.back();
    });
    $("#next").on('click', handle.next);
    $("#play").on('click', () => {
        document.getElementById('player').play();
    });

    // Facebook
    $('#facebook').on('click', fbShare);

});

/* Class lists for RECORD button */
let buttonstate = {
    play: 'fa fa-5x fa-play primary-color',
    record: 'fa fa-5x fa-microphone success-color',
    stop: 'fa fa-5x fa-stop alert-color',
    pause: 'fa fa-5x fa-pause primary-color',
}


let init = {
    /* Get current ID from URL */
    getPageID: function () {
        return window.location.href.slice(window.location.href.indexOf("=") + 1);
    },
    
    /* THANKS page: Attach appropriate link to user's new recording */
    thanks: function () {
        $('#play-ref').attr('href', '/play?id=' + this.getPageID());
    },

    /* PLAY page: Send POST request for entry data */
    play: function () {
        $.post("/play_post", {
            id: this.getPageID()
        }, function (data) {
            let context = JSON.parse(data);
            // console.log(context);
            let maskColor = "rgba(0,0,0,0.3)";
            let css = {
                "background": "linear-gradient( " + maskColor + "," + maskColor + "), url(' " + context.pic_url + " ')",
                "background-repeat": "no-repeat",
                "background-position": "center center",
                "background-origin": "border-box",
                "background-size": "cover",
                "background-attachment": "fixed",
            };

            /* Attach data to appropriate elements */
            $('.full-bg-image').css(css);
            $('#player').attr('src', context.audio_url);
            $('#audio-title').text(context.title);
            $('#age').text(context.age);
            $('#gender').text(context.gender);
            $('#location').text(context.location);

        });
    }
};

/********************************************/


/********************************************
 * Create handler functions
 */

let handle = {
    /* RECORD Button is Pressed */
    recordButton: function() {
        if (!media.recording && !media.playAvailable) {
            controls.startRecording();
        } else if (media.recording) {
            controls.stopRecording();
        } else if (media.playAvailable && !media.playing) {
            document.getElementById('player').play();
            media.playing = true;
            $('#record').removeClass().addClass(buttonstate.pause);
        } else if (media.playAvailable && media.playing) {
            document.getElementById('player').pause();
            media.playing = false;
            $('#record').removeClass().addClass(buttonstate.play);
        }
    },

    /* Run Everytime A Form Component is Changed */
    formChange: function() {
        if (validate.complete()) {
            $("#upload-btn").removeClass('disabled');
        } else if (!$("#upload-btn").hasClass('disabled')) {
            $("#upload-btn").addClass('disabled');
        }
    },

    /* Triggered by value change on any INPUT field */
    inputChange: function() {
        if ($(this).attr('name') === "age" || $(this).attr('name') === "email") {
            $(this).siblings().remove();
        }
        handle.formChange();
    },

    /* Triggered by file change on INPUT[type=FILE]  */
    picSelect: function() {
        let file = $("#pic").prop('files')[0];
        let url = window.URL.createObjectURL(file);
        let html = '<img height="50" src="' + url + '" class="thumb" />';
        $('img').remove();
        $("#pic").parent().append(html);
    },

    /* RESET Button is Pressed */
    reset: function() {
        media.recording = false;
        media.playAvailable = false;
        media.blobFile = null;
        $('#record').removeClass().addClass(buttonstate.record);
        $('#reset').removeClass('alert-color').addClass('reset-disabled');
        $('#timer').text('0:30');
        $('.spinner').addClass('hide');
        handle.formChange();
    },

    /* UPLOAD Button is Pressed */
    upload: function() {

        /* Validate Form */
        if (!validate.complete()) {
            alert('Make sure all fields are filled out!');
            return;
        }
        if (!validate.filter()) {
            return;
        }

        /* Create file object from blob object, attach to form */
        var file = new File([media.blobFile], "test.oga");
        var form = $('form')[0];
        var formData = new FormData(form);
        formData.append('audio_file', file);

        /* Trigger loading animation */
        $('#upload-btn').css({
            'color': '#cc4b37',
            'background-color': '#cc4b37'
        });
        $('.spinner').removeClass('hide');

        /* Send POST request */
        $.ajax({
                url: '/record_post',
                data: formData,
                type: 'POST',
                contentType: false,
                processData: false,
            })
            .done((id) => {
                console.log(id);
                window.location.href = "/thanks?id=" + id;
            });
    },

    /* NEXT Button is Pressed */
    next: function() {
        let run = true;
        let newID;

        /* Get new page ID and make sure it's not the same as the current ID */
        let id = init.getPageID();
        do {
            $.post("/random", (newID) => {
                if (newID != id) {
                    console.log("successful if statement");
                    run = false;
                    window.location.href = "/play?id=" + newID;
                }
            });
        }
        while (newID == id)
    }
};

/* Control Actions Taken When Record Button is Pressed */
let controls = {
    startRecording: function() {
        media.mediaRecorder.start();
        media.recording = true;
        controls.startTimer();
        console.log(media.mediaRecorder.state);
        console.log("recorder started");
        $('#record').removeClass().addClass(buttonstate.stop);
    },

    /* Triggered by RECORD button */
    stopRecording: function() {
        media.mediaRecorder.stop();
        media.recording = false;
        clearInterval(countdown);
        console.log("recorder stopped");
        console.log(media.mediaRecorder.state);
        $("#record").removeClass().addClass(buttonstate.play);
        $("#reset").removeClass('reset-disabled').addClass('alert-color');
    },

    /* Triggered by MEDIA ONSTOP event */
    mediaStop: function(e) {

        /* Create and Save Blob from Recording */
        var blob = new Blob(media.chunks, {
            'type': 'audio/ogg; codecs=opus'
        });
        media.chunks = [];
        media.blobFile = blob;
        media.file = new File([blob], "recorded_audio");

        /* Attach Blob to Audio Player */
        let audioURL = window.URL.createObjectURL(blob);
        $("#player").attr("src", audioURL);
        
        
        media.playAvailable = true;
        handle.formChange();
    },

    /* This starts a timer, like it says */
    startTimer: function() {
        let seconds = 30;
        countdown = setInterval(() => {
            seconds--;
            let secString = seconds < 10 ? "0" + seconds.toString() : seconds.toString();
            let display = "0:" + secString;
            $('#timer').text(display);

            /* Trigger the recording stop functions if time runs out */
            if (seconds === 0) {
                clearInterval(countdown);
                controls.stopRecording();
                alert('times up!');
            }
        }, 1000);
    }
}

/********************************************/



/********************************************
 * Initialize mediaRecorder
 */

let media = {
    chunks: [],
    recording: false,
    playing: false,
    playAvailable: false,
    mediaRecorder: null,
    file: null,
    blobFile: null,
};

navigator.mediaDevices.getUserMedia({

    /* Access the Microphone */
        audio: true,
        video: false
    })

    .then(function (stream) {

        /* Create mediaRecorder and Event Listeners */
        media.mediaRecorder = new MediaRecorder(stream);

        media.mediaRecorder.ondataavailable = function (e) {
            media.chunks.push(e.data);
        }

        media.mediaRecorder.onstop = function (e) {
            controls.mediaStop(e);
        }
    })
    .catch(function (err) {
        console.log(err);
    });

/********************************************/



/********************************************
 * Form validation
 */

let validate = {
    inputNamesArray: ['age', 'location', 'title', 'email'],

    /* Check all form elements for completeness */
    complete: function () {
        let complete = true;

        /* Check INPUT tags */
        for (item in this.inputNamesArray) {
            let selector = $('input[name="' + this.inputNamesArray[item] + '"]');
            console.log(this.inputNamesArray[item] + ": " + selector.val());
            if (!selector.val()) {
                console.log(this.inputNamesArray[item] + ' returned undefined');
                complete = false;
            }
        }

        /* Check SELECT tag */
        console.log('gender: ' + $('select[name="gender"]').val());
        if (!$('select[name="gender"]').val()) {
            complete = false;
        }

        /* Check PIC UPLOAD */
        console.log('pic files: ' + $('#pic').prop('files').length);
        if ($('#pic').prop('files').length < 1) {
            complete = false;
        }

        /* Check BLOB */
        console.log("blob: " + media.blobFile);
        if (media.blobFile === null) {
            complete = false;
        }
        console.log('complete:  ' + complete);

        return complete;
    },

    filter: function () {
        let areWeGood = true;

        let errorMessage = function (msg) {
            let html = '<div class="error-alert">' + msg + '</div>';
            return html;
        }

        /* Check AGE */
        let age = $('input[name="age"]').val();
        if (age > 120 && age) {
            let msg = "Please enter a real age.";
            $('input[name="age"]').parent().append(errorMessage(msg));
            areWeGood = false;
        }

        /* Check EMAIL */
        let email = $('input[name="email"]').val();
        if (email.indexOf('@') < 1 && email) {
            let msg = "At least make it look real."
            $('input[name="email"]').parent().append(errorMessage(msg));
            areWeGood = false;
        }

        /* Check TITLE */
        let title = $('input[name="title"]').val();
        if (title.length > 40 && title) {
            let msg = "Character limit is 40.";
            $('input[name="title"]').parent().append(errorMessage(msg));
            areWeGood = false;
        }

        /* Trim and escape html */
        for (item in validate.inputNamesArray) {
            let selector = $('input[name="' + validate.inputNamesArray[item] + '"]');
            let val = selector.val();
            let trimVal = val.trim();
            let sanitizedVal = validate.escapeHTML(val);
            selector.val(sanitizedVal);
        }

        return areWeGood;
    },
    escapeHTML: function (str) {
        var entityMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;',
            '`': '&#x60;',
            '=': '&#x3D;'
        };
        return String(str).replace(/[&<>"'`=\/]/g, function (s) {
            return entityMap[s];
        });
    }
}

/********************************************/



/********************************************
 * FB Share
 */

function fbShare() {
    let url = window.location.href;
    FB.ui({
        app_id: '137264381218',
        redirect_uri: url,
        method: 'share',
        href: url,
    }, function (response) {});
}

/********************************************/
/********************************************
 * Initialize, Taking Current Page Into Account
 */

$(document).foundation();
$(document).ready(() => {
    if (window.location.href.indexOf("/thanks") > 0) {
        init.thanks();
    }

    if (window.location.href.indexOf("/play") > 0) {
        init.play();
    }

    /*****  JQUERY EVENT LISTENERS *********/
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

let buttonstate = {
    play: 'fa fa-5x fa-play primary-color',
    record: 'fa fa-5x fa-microphone success-color',
    stop: 'fa fa-5x fa-stop alert-color',
    pause: 'fa fa-5x fa-pause primary-color',
}

let init = {
    getPageID: function () {
        return window.location.href.slice(window.location.href.indexOf("=") + 1);
    },
    thanks: function () {
        $('#play-ref').attr('href', '/play?id=' + this.getPageID());
    },
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

    formChange: function() {
        if (validate.complete()) {
            $("#upload-btn").removeClass('disabled');
        } else if (!$("#upload-btn").hasClass('disabled')) {
            $("#upload-btn").addClass('disabled');
        }
    },

    inputChange: function() {
        if ($(this).attr('name') === "age" || $(this).attr('name') === "email") {
            $(this).siblings().remove();
        }
        handle.formChange();
    },

    picSelect: function() {
        let file = $("#pic").prop('files')[0];
        let url = window.URL.createObjectURL(file);
        let html = '<img height="50" src="' + url + '" class="thumb" />';
        $('img').remove();
        $("#pic").parent().append(html);
    },

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

    upload: function() {
        if (!validate.complete()) {
            alert('Make sure all fields are filled out!');
            return;
        }
        if (!validate.filter()) {
            return;
        }

        var file = new File([media.blobFile], "test.oga");
        var form = $('form')[0];
        var formData = new FormData(form);
        formData.append('audio_file', file);

        // console.log(formData);
        $('#upload-btn').css({
            'color': '#cc4b37',
            'background-color': '#cc4b37'
        });
        $('.spinner').removeClass('hide');

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

    next: function() {
        let run = true;
        let newID;
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
    },

    mediaStop: function(e) {
        console.log("recorder stopped");
        var blob = new Blob(media.chunks, {
            'type': 'audio/ogg; codecs=opus'
        });
        media.chunks = [];
        media.blobFile = blob;
        media.file = new File([blob], "recorded_audio");
        let audioURL = window.URL.createObjectURL(blob);
        $("#player").attr("src", audioURL);
        handle.formChange();
    }
};

let controls = {
    startRecording: function() {
        media.mediaRecorder.start();
        media.recording = true;
        controls.startTimer();
        console.log(media.mediaRecorder.state);
        console.log("recorder started");
        $('#record').removeClass().addClass(buttonstate.stop);
    },
    stopRecording: function() {
        media.mediaRecorder.stop();
        media.recording = false;
        console.log(media.mediaRecorder.state);
        console.log("recorder stopped");
        clearInterval(countdown);
        $("#record").removeClass().addClass(buttonstate.play);
        $("#reset").removeClass('reset-disabled').addClass('alert-color');
        media.playAvailable = true;
    },
    startTimer: function() {
        let seconds = 30;
        countdown = setInterval(() => {
            seconds--;
            let secString = seconds < 10 ? "0" + seconds.toString() : seconds.toString();
            let display = "0:" + secString;
            $('#timer').text(display);
            if (seconds === 0) {
                clearInterval(countdown);
                stopRecording();
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
        audio: true,
        video: false
    })
    .then(function (stream) {
        media.mediaRecorder = new MediaRecorder(stream);

        media.mediaRecorder.ondataavailable = function (e) {
            media.chunks.push(e.data);
        }

        media.mediaRecorder.onstop = function (e) {
            handle.mediaStop(e);
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
    complete: function () {
        let complete = true;
        for (item in this.inputNamesArray) {
            let selector = $('input[name="' + this.inputNamesArray[item] + '"]');
            console.log(this.inputNamesArray[item] + ": " + selector.val());
            if (!selector.val()) {
                console.log(this.inputNamesArray[item] + ' returned undefined');
                complete = false;
            }
        }
        console.log('gender: ' + $('select[name="gender"]').val());
        if (!$('select[name="gender"]').val()) {
            complete = false;
        }

        console.log('pic files: ' + $('#pic').prop('files').length);
        if ($('#pic').prop('files').length < 1) {
            complete = false;
        }

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
        for (item in inputNamesArray) {
            let selector = $('input[name="' + inputNamesArray[item] + '"]');
            let val = selector.val();
            let trimVal = val.trim();
            let sanitizedVal = escapeHtml(val);
            selector.val(sanitizedVal);
        }

        return areWeGood;
    },
    escapeHTML: function () {
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
        return String(string).replace(/[&<>"'`=\/]/g, function (s) {
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
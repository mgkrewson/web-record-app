$(document).foundation();


/**
 * For PLAY page
 */

$("#back").on('click', () => {window.history.back()});




/**
 * Initialize mediaRecorder
 */
var chunks = [];
let blobFile;
let recording = false;
let playAvailable = false;

let buttonstate = {
    play: 'fa fa-3x fa-play primary-color',
    record: 'fa fa-3x fa-microphone success-color',
    stop: 'fa fa-3x fa-stop alert-color',
    pause: 'fa fa-3x fa-pause primary-color',
}

navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
    })
    .then(function (stream) {
        var mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.onstop = function (e) {
            console.log("recorder stopped");

            var blob = new Blob(chunks, {
                'type': 'audio/ogg; codecs=opus'
            });
            chunks = [];
            blobFile = blob;

            let file = new File([blob], "recorded_audio");

            let audioURL = window.URL.createObjectURL(blob);
            $("#player").attr("src", audioURL);
            console.log(blobFile);

            checkForCompletion();
        }

        $("#record").on('click', () => {
            if (!recording && !playAvailable) {
                startRecording();
                recording = true;
                startTimer();
            } else if (recording) {
                stopRecording();
                recording = false;
            } else if (playAvailable) {
                document.getElementById('player').play();
            }
            
        });

        function startRecording() {
            mediaRecorder.start();
            console.log(mediaRecorder.state);
            console.log("recorder started");
            $('#record').removeClass('success-color').addClass('alert-color').
                removeClass('fa-microphone').addClass('fa-stop');
        }
        
        function stopRecording() {
            mediaRecorder.stop();
            console.log(mediaRecorder.state);
            console.log("recorder stopped");
            clearInterval(countdown);
            $("#record").removeClass("alert-color").addClass('primary-color')
                .removeClass('fa-stop').addClass('fa-play');
            $("#reset").removeClass('reset-disabled').addClass('alert-color');
            playAvailable = true;
        }

        function startTimer() {
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

        mediaRecorder.ondataavailable = function (e) {
            chunks.push(e.data);
        }


    })
    .catch(function (err) {
        console.log(err);
    });



$("#reset").on('click', () => {
    recording = false;
    playAvailable = false;
    blobFile = null;
    $('#record').removeClass('fa-play').addClass('fa-microphone').removeClass('primary-color').addClass('success-color');
    $('#reset').removeClass('alert-color').addClass('reset-disabled');
    $('#timer').text('0:30');
    checkForCompletion();
});




$("form").submit(function (e) {
    e.preventDefault();
});

$("#upload-pic").on('click', () => {
    $('#pic').click();
});

$("#pic").change(() => {
    let file = $("#pic").prop('files')[0];
    let url = window.URL.createObjectURL(file);
    let html = '<img height="50" src="' + url + '" class="thumb" />';
    $('img').remove();
    $("#pic").parent().append(html);
});

$("input").change(() => checkForCompletion());

let inputNamesArray = ['age', 'gender', 'location', 'title', 'email'];

function checkForCompletion() {
    let complete = true;
    for (item in inputNamesArray) {
        let selector = $('input[name="' + inputNamesArray[item] + '"]');
        console.log(inputNamesArray[item] + ": " + selector.val());
        if (!selector.val()) {
            console.log(inputNamesArray[item] + ' returned undefined');
            complete = false;
        }
    }
    console.log('pic files: ' + $('#pic').prop('files').length);
    if ($('#pic').prop('files').length < 1) {
        complete = false;
    }
    
    console.log("blob: "+ blobFile);
    if (!blobFile) {
        complete = false;
    }
    console.log('complete:  ' + complete);

    if (complete) {
        $("#upload-btn").removeClass('disabled');
    } else if (!$("#upload-btn").hasClass('disabled')) {
        $("#upload-btn").addClass('disabled');
    }
}


$("#upload-btn").on('click', function (e) {

    var file = new File([blobFile], "test.oga");

    var form = $('form')[0];
    var formData = new FormData(form);
    formData.append('audio_file', file);

    console.log(formData);

    $.ajax({
        url: '/process_post',
        data: formData,
        type: 'POST',
        contentType: false, // NEEDED, DON'T OMIT THIS (requires jQuery 1.6+)
        processData: false, // NEEDED, DON'T OMIT THIS
    })
    .done((data) => {
        window.location.href = "/thanks";
    });
});


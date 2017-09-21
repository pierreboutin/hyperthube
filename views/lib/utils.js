function ttSuccess(element, str) {
	element.parent().removeClass("has-error").addClass("has-success");
	element.attr('data-original-title', str);
}
function ttError(element, str) {
	element.tooltip();
	element.parent().removeClass("has-success").addClass("has-error");
	element.attr("data-original-title", str);
}
function charCount(str, char) {
    return str.split(char).length - 1;
}
function getAge(birth_date) {
    if (charCount(birth_date, '-') == 0)
        return -1;

    var Year = birth_date.split('-')[0]
    var Month = birth_date.split('-')[1]
    var Day = birth_date.split('-')[2]

    var today = new Date();
    var age = today.getFullYear() - Year;
    var m = today.getMonth() - Month;
    if (m < 0 || (m === 0 && today.getDate() < Day))
        age--;
    return age;
}
function deleteChildrenElems(divElement) {
    while (divElement.firstChild)
        divElement.removeChild(divElement.firstChild)
}

function removeElem(elem) {
    if (elem != null)
        elem.parentNode.removeChild(elem);
}
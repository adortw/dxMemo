
$(function () {
    let monCols = [["01", "Jan"], ["02", "Feb"], ["03", "Mar"], ["04", "Apr"],
                    ["05", "May"], ["06", "Jun"], ["07", "Jul"], ["08", "Aug"],
                    ["09", "Sep"], ["10", "Oct"], ["11", "Nov"], ["12", "Dec"]];
    
    let events = {
        init: function () {
            console.log(cost);
            events.handleGridData(cost);
        },
        
        handleGridData: function (dbDatas) {
            let cols = [];
            // �w�q columns
            {
                cols = [{
                    caption: "Item",
                    //columns: [{
                    //    caption: "",
                    width: 70,
                    alignment: "center",
                    dataField: "CATE_NAME",
                    //}],
                }, {
                    caption: "Item1",
                    //columns: [{
                    //    caption: "",
                    width: 130,
                    dataField: "FORMAT_NAME",
                    alignment: "center",
                    customizeText: function (cellInfo) {
                        return cellInfo.valueText.replace("\n", "<br/>");
                    },
                    encodeHtml: false,
                    //}],
                },
                ];
                //12�Ӥ�columns & status
                $.each(monCols, function (i, obj) {
                    //console.log(obj)
                    let colYM = "" + obj[1] + "-2022";
                    cols.push({
                        caption: colYM,
                        columns: [{
                            caption: "plan",
                            dataField: obj[0] + "_PLAN_AMT",
                            width: 55,
                            dataType: "number",
                            alignment: "right",
                        }, {
                            caption: "actual",
                            dataField: obj[0] + "_ACTUAL_AMT",
                            width: 55,
                            dataType: "number",
                            alignment: "right",
                        }],
                    });
                });
                cols.push({
                    caption: "discount total",
                    dataField: "ROWSUM",
                    width: 70,
                    dataType: "number",
                    alignment: "right",
                    encodeHtml: false,
                });
            }

            // �w�q data source
            {
                //�� �馩�p�p 
                {
                    dbDatas.forEach(function (item) {
                        item["ROWSUM"] = null;
                        if (item.SUB_TOTAL === "Y") {
                            let rowSum = 0;
                            $.each(monCols, function (i, obj) {
                                rowSum += item[obj[0] + "_ACTUAL_AMT"] == 0 ? item[obj[0] + "_PLAN_AMT"] : item[obj[0] + "_ACTUAL_AMT"]; //sum ACTUAL if actual�S�� �h+PLAN
                            });
                            item["ROWSUM"] = rowSum;
                        }
                    });
                }
                //�� �馩�`�p
                {
                    let reducer = function (previousValue, currentValue) { return previousValue + currentValue }; //�֥[function
                    let rowTotal = {
                        "CATE_NAME": "",
                        "FORMAT_NAME": "sum",
                        "GROUP2": 1, //�X�֧P�_��
                    };
                    let rowSumTotal = 0;    //��l �馩�`�p���p�p
                    //�u12�Ӥ� �A���O�D�X�C�Ӥ몺�馩��A�U�ۥ[�`�զ��̫�@�C
                    if (dbDatas.length > 0) {
                        $.each(monCols, function (i, obj) {
                            let planAmt = [];
                            let actualAmt = [];
                            //�D�X ���� "SUB_TOTAL" === "Y"
                            dbDatas.forEach(function (item) {
                                if (item["SUB_TOTAL"] === "Y") {
                                    //console.log(item);
                                    planAmt.push(item[obj[0] + "_PLAN_AMT"]);
                                    actualAmt.push(item[obj[0] + "_ACTUAL_AMT"]);
                                }
                            });
                            rowTotal[obj[0] + "_PLAN_AMT"] = planAmt.reduce(reducer);//reduce() ��k�N�@�Ӳ֥[���ΰ}�C���C�������]�ѥ��ܥk�^�ǤJ�^�I�禡�A�N�}�C�Ƭ���@�ȡC(js) //�U��馩�}�C�U�۲֥[
                            rowTotal[obj[0] + "_ACTUAL_AMT"] = actualAmt.reduce(reducer);
                            rowSumTotal += rowTotal[obj[0] + "_ACTUAL_AMT"] == 0 ? rowTotal[obj[0] + "_PLAN_AMT"] : rowTotal[obj[0] + "_ACTUAL_AMT"];   //�馩�`�p���p�p
                        });
                        //�� �馩�`�p���p�p
                        rowTotal["ROWSUM"] = rowSumTotal;

                        dbDatas.push(rowTotal);
                    }
                }
            }

            events.buildDG(dbDatas, cols);
        },

        buildDG: function (ds, cols) {

            $("#dxDG").dxDataGrid({
                dataSource: ds,
                showBorders: true,
                showRowLines: true,
                showColumnLines: true,
                sorting: {
                    mode: "none"
                },
                paging: { enabled: false },
                columns: cols,
                wordWrapEnabled: true,
                onCellPrepared: function (e) {
                    //header style
                    if (e.rowType == "header") {
                        //css ����]�w!
                        e.cellElement.css("text-align", "center");
                        e.cellElement.css("vertical-align", "middle");
                    }
                    //data style
                    if (e.rowType == "data") {
                        //console.log(e);
                        //�ƭȮ榡
                        if (e.columnIndex > 1) {
                            let formatValue = e.text;
                            if ((e.data["FORMAT_NAME"]).includes("point")) {
                                formatValue = "" + getNumberByUnit(e.value, 1, 4);
                            } else {
                                formatValue = getNumberByUnit(e.value, 1, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                            }
                            if (e.value < 0)
                                formatValue = "(" + formatValue.substring(1) + ")";
                            e.cellElement[0].innerHTML = formatValue;  //innerHTML : ���w��ܦb�e�ݥ���
                        }
                        //�Ĥ@�� �X���x�s��
                        if (e.columnIndex == 0) {
                            if (e.data["GROUP2"] === 1) {
                                e.cellElement.attr("rowspan", getRowspan(ds, e.rowIndex));
                                e.cellElement.css("background-color", "#A6A6A6");
                            }
                            else {
                                e.cellElement.css("display", "none");
                            }
                        } else {
                            //�C��馩 row color                                     
                            if (e.data["SUB_TOTAL"] === "Y" || e.data["FORMAT_NAME"].substring(0, 6) === "discount") //["SUB_TOTAL"] === "Y": �C��馩
                                e.cellElement.css("background-color", "#c6b6d6");
                            //�t�Ƭ��r
                            if (e.value < 0)
                                e.cellElement.css("color", "red");
                        }
                    }

                },
            });
        },

    };

    events.init();

    //�p��Ĥ@�檺�����X�֮��
    function getRowspan(ds, rowIndex) {
        let i = rowIndex;
        let rowSpan = 1;
        while (i < ds.length - 1 && ds[i].SUB_TOTAL !== "Y") { //ds.length-1 : ���I���� ���κ�
            i++;
            rowSpan++;
        }
        return rowSpan;
    };
    //�d��Ƴr��
    function thousandthComma(value) {
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    //�榡�ƼƦrBy���B�p�� ex:(1234500000, 1000000, 0) => 1235
    function getNumberByUnit(value, unit, point) {
        let absValue = Math.abs(value); //Math.abs�������(�h���t��)�A�קK-0.015�A�|�ˤ��J����-0.01
        if (point == null)
            return value / unit;
        else {
            let multip = value < 0 ? -1 : 1;
            return +(Math.round((absValue / unit) + "e+" + point) + "e-" + point) * multip;
        }
    }

});


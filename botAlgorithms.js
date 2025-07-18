import fs from "fs";
import {execSync} from "child_process";
class BotAlgorithms {
    folderName = "pretend-project-files";
    botCount = 3;
    fileNameList = null;
    lineEditIndexList = null;
    selectedScenario = null;

    // scenario flags
    createFeatureBranch = false;
    switchToFeatureBranch = false;
    stageUserChanges = false;
    commitUserChanges = false;
    makeMultipleUserCommits = false;
    addUnstagedChangesAfterUserCommit = false;
    addStagedChangesAfterUserCommit = false;

    constructor() {
        this.runBot();
    }

    runBot() {
        this.fileNameList = fs.readdirSync(this.folderName);
        this.generateFiles();
        this.selectScenario();
        this.adjustFlags();
        this.selectLines();

        this.gitProcess();
    }

    generateFiles() {
        if (!fs.existsSync("scenarios.json")) {
            fs.copyFileSync('scenarios-lock.json', 'scenarios.json');
        }
        
        if (!fs.existsSync("instructions.txt")) {
            fs.writeFileSync("instructions.txt", "");
        }

        this.scenarios = JSON.parse(fs.readFileSync('scenarios.json', 'utf-8'));
    }

    selectScenario() {
        const randomIndex = Math.floor(Math.random() * this.scenarios.length);
        const randomScenario = this.scenarios.splice(randomIndex, 1)[0];

        if (this.scenarios.length === 0) {
            const reset = fs.readFileSync("scenarios-lock.json", "utf-8");
            fs.writeFileSync("scenarios.json", reset);
        }
        else {
            const updatedScenarios = JSON.stringify(this.scenarios);    
            fs.writeFileSync("scenarios.json", updatedScenarios);
        }

        this.selectedScenario = randomScenario;
    }

    adjustFlags() {
        const num = this.selectedScenario.number;

        if (num !== 2 && num !== 3 && num !== 15 && num !== 16) {
            this.createFeatureBranch = true;
        }

        if (num !== 2 && num !== 3 && num !== 15 && num !== 16 && num !== 18) {
            this.switchToFeatureBranch = true;
        }

        if (num !== 2 && num !== 3 && num !== 12) {
            this.stageUserChanges = true;
        }

        if (num !== 2 && num !== 3 && num !== 12 && num !== 16) {
            this.commitUserChanges = true;
        }
        
        if (num === 0 || num === 9 || num === 10 || num === 18) {
            this.makeMultipleUserCommits = true;
        }

        if (num === 11 && num === 12) {
            this.addUnstagedChangesAfterUserCommit = true;
        }

        if (num === 17) {
            this.addStagedChangesAfterUserCommit = true;
        }
    }

    selectLines() {
        const lineEditIndexList = [];

        for (const fileName of this.fileNameList) {
            const content = fs.readFileSync(`${this.folderName}/${fileName}`, "utf-8");
            const contentLinesArr = content.split("\n");
            const lineIndex = Math.floor(Math.random() * contentLinesArr.length);

            lineEditIndexList.push(lineIndex);
        }

        this.lineEditIndexList = lineEditIndexList;
    }
    gitProcess() {
        // return to baseline
        execSync("git config user.name 'User'");
        execSync("git config user.email 'user@gitglot.com'");
        execSync("git reset --hard");
        execSync("git checkout main");
        execSync("git pull");

        // edit pretend files as bot
        for (let i = 0; i < this.fileNameList.length; i++) {
            this.botEditFile(this.fileNameList[i], this.lineEditIndexList[i]);
            execSync(`git add ${this.folderName}/${this.fileNameList[i]}`);
        }
        
        // perform commits as bot
        execSync(`git commit -m "edit files" --author="Bot <bot@gitglot.com>"`);
        execSync("git push");
        execSync("git reset --hard HEAD~1");

        // create and switch to user branch
        if (this.createFeatureBranch) {
            const userBranch = `branch-${Math.random()}`

            console.log("-- CREATE USER BRANCH --");// testing

            const existingBranches = execSync("git branch --list", { encoding: 'utf-8' });
            const hasDuplicateBranch = existingBranches.split("\n").some(branch => branch.trim() === userBranch);

            if (!hasDuplicateBranch) {
                execSync(`git branch ${userBranch}`);
            }

            if (this.switchToFeatureBranch) {
                console.log("-- SWITCH TO USER BRANCH --");// testing
                execSync(`git switch ${userBranch}`);
            }
            else {
                console.log(`Created ${userBranch}`);
            }
        }
        
        let userCommitCount = 1;
        if (this.makeMultipleUserCommits || this.addUnstagedChangesAfterUserCommit || this.addStagedChangesAfterUserCommit) {
            userCommitCount = Math.random() < .5 ? 2 : 3;
        }

        // edit pretend files as automated user
        for (let i = 1; i <= userCommitCount; i++) {

            for (let j = 0; j < this.fileNameList.length; j++) {
                this.botEditFile(this.fileNameList[j], this.lineEditIndexList[j]);
                    if (this.stageUserChanges && !(this.addUnstagedChangesAfterUserCommit && i === userCommitCount)) {
                        execSync(`git add ${this.folderName}/${this.fileNameList[j]}`);
                        console.log(`-- ADD CHANGES ON file${j}.txt FOR COMMIT ${i} --`);// testing
                    }
            }
        
            if (this.commitUserChanges && !((this.addStagedChangesAfterUserCommit || this.addUnstagedChangesAfterUserCommit) && i === userCommitCount)) {
                execSync(`git commit -m "edit files"`);
                console.log(`-- MAKE COMMIT ${i} --`);// testing
            }
        }
        
        // edit and console log user instructions
        this.editInstructionsFile(this.fileNameList);
    }
    botEditFile(fileName, lineIndex) {
        const content = fs.readFileSync(`${this.folderName}/${fileName}`, "utf-8");
        let linesArr = content.split("\n");

        this.editSelectedLine(linesArr, lineIndex);        
        const revisedContent = linesArr.join("\n");

        fs.writeFileSync(`${this.folderName}/${fileName}`, revisedContent);
    }
    editSelectedLine(linesArr, lineIndex) {
        const rnd = Math.random();
        const editType = rnd > .25 ? "change" : "delete";

        if (editType === "change") {
            linesArr[lineIndex] = Math.random();
        }
        else if (editType === "delete") {
            linesArr.splice(lineIndex, 1);
        }
    }
    editInstructionsFile(fileList) {
        let content = `\nScenario ${this.selectedScenario.number}:\n${this.selectedScenario.instructions}\n\nMerge Instructions:\n`;

        for (const fileName of fileList) {
            const rnd = Math.random();
            let instruction =
            rnd > .6666 ? "keep current" :
            rnd > .3333 ? "keep incoming" : "keep both";

            instruction += ` changes for ${fileName}\n`;
            content += instruction;
        }

        content += "\nRefer to instructions.txt to see these instructions again\n(Refer to README.md for basic app instructions)"

        console.log(content);
        fs.writeFileSync("instructions.txt", content);
    }
}

export default new BotAlgorithms();
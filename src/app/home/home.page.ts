import {Component, ElementRef, OnInit, Renderer2, ViewChild} from '@angular/core';
import {BALLOON_URL, NAR_URL, SHELL_ID} from '../app.config';
import {DomSanitizer} from '@angular/platform-browser';


declare const NarLoader: any;
declare const cuttlebone: any;
declare const SakuraScriptPlayer: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  @ViewChild('ukaDispZone') ukaDisp: ElementRef;

  constructor(private sanitize: DomSanitizer,
              private render: Renderer2) {
  }

  ngOnInit(): void {
    this.runScript();
  }

  runScript() {
    if (!(NarLoader.loadFromURL instanceof Function) &&
        NarLoader.NarLoader.loadFromURL instanceof Function) {
      Object.keys(NarLoader.NarLoader).forEach((a) => {
        NarLoader[a] = NarLoader.NarLoader[a];
      });
    }
    Promise.all([
      NarLoader.loadFromURL(NAR_URL),
      NarLoader.loadFromURL(BALLOON_URL)
    ]).then((args) => {
      const balloonDir = args[1].asArrayBuffer();
      const shellDir = args[0].getDirectory('shell/' + SHELL_ID).asArrayBuffer();
      const balloon = new cuttlebone.Balloon(balloonDir);
      const shell = new cuttlebone.Shell(shellDir);
      return Promise.all([
        balloon.load(),
        shell.load()
      ]);
    }).then((args) => {
      const shell = args[1];
      const balloon = args[0];
      const nmdmgr = new cuttlebone.NamedManager();
      // Angularのrenderer2で表示
      this.render.appendChild(this.ukaDisp.nativeElement, nmdmgr.element);
      const hwnd = nmdmgr.materialize(shell, balloon);
      const named = nmdmgr.named(hwnd);
      return named.load();
    }).then((named) => {
      const ssp = new SakuraScriptPlayer(named);
      // つつかれ
      named.on('mousedblclick', (ev) => {
        const request = {
          ID: 'OnMouseDoubleClick',
          Reference0: ev.offsetX,
          Reference1: ev.offsetY,
          Reference2: ev.button,
          Reference3: ev.scopeId,
          Reference4: ev.region,
          Reference5: ev.wheel
        };
        const response = this.shioriRequest(request);
        ssp.play(response);
      });
      // なでられ
      const moves = {};
      const timers = {};
      named.on('mousemove', (ev) => {
        const request = {
          ID: 'OnMouseMove',
          Reference0: ev.offsetX,
          Reference1: ev.offsetY,
          Reference2: ev.button,
          Reference3: ev.scopeId,
          Reference4: ev.region,
          Reference5: ev.wheel
        };
        const ID = '' + request.Reference3 + request.Reference4;
        moves[ID] = moves[ID] || 0;
        moves[ID]++;
        clearTimeout(timers[ID]);
        timers[ID] = setTimeout(() => {
          moves[ID] = 0;
        }, 5000);
        if (moves[ID] > 100) {
          moves[ID] = 0;
          const response = this.shioriRequest(request);
          ssp.play(response);
        }
      });
      // 選択肢
      named.on('choiceselect', (ev) => {
        const request = {
          ID: 'OnChoiceSelect',
          Reference0: ev.id,
        };
        const response = this.shioriRequest(request);
        ssp.play(response);
      });
      // ランダムトーク
      let iRandamTalk = 10;
      setInterval(() => {
        if (iRandamTalk <= 0) {
          while (Math.round(Math.random() * 10) > 1) iRandamTalk++;
          if (!ssp.playing) ssp.play(this.shioriRequest({ID: 'OnTalk'}));
        } else iRandamTalk--;
      }, 1000);
      ssp.play(this.shioriRequest({ID: 'OnBoot'}));
    });
  }

  private choice(arr) {
    return arr[(Math.random() * 100 * (arr.length) | 0) % arr.length];
  }

  shioriRequest(req) {
    switch (req.ID) {
      case 'OnBoot':
        // return '\\0\\s[1]きゃあああああ！！\\w9 \\n \\s[1]何、\\w5なんですかぁ！？\\w9\\w9\\1…\\w5…\\w5仕事やて。\\w9\\n寝ぼけてへんと、\\w5さっさと起きや。\\w9\\w9\\0\\s[3]\\n\\n…\\w5…\\w5ユーザさん…\\w5…\\w5\\w9\\nおはようございます？\\w9\\w9\\1\\n\\nちゃうわい、\\w5ダァホ。\\e';
        return '\\0 \\s[0] お、マスター。やっほー！';
        // case 'OnTalk':
        //   return this.choice([
        //     '\\1\\s[10]\\0\\0\\s[7]処理の速さをはかるためだけに円周率パイを何千万桁も計算させるとか、\\w5やめてくださいね！\\w9\\w9\\1\\s[10]なんでや。\\w9よくある話やないか。\\w9\\w9\\0\\s[26]\\n\\n[half]計算たいへんなんですよ、\\w5あれ…\\w9\\w9\\1\\n\\n[half]確かに、\\w5めちゃくちゃ大量に計算こなさんと出されへんけど。\\w9\\w9\\0\\s[21]\\n\\n[half]でも、\\w5女の子が気にする部分がでっかくなるなら、\\w5がんばるかも…\\w9\\w9\\1\\s[11]\\n\\n[half]…\\w5それはパイ違いや。',
        //     '\\u\\s[10]\\0\\s[2]あ、\\w5あれ！？\\w9ここにもしぃちゃんがいる！？\\w9\\w9\\1…\\w5…\\w5なんやねん、\\w5ワイはずっとここにいてるがな。\\w9\\w9\\0\\s[3]\\n\\nあっちで、\\w5一生懸命ブラウン管テレビさんに話しかけてました…\\w5…\\w9\\w9\\w5\\1\\n\\n…\\w5…\\w5力のかぎりに蓋閉めたろか、\\w5ほんま…\\w5…\\w5\\e',
        //     '\\u\\s[10]\\h\\s[3]私をカバンの中に入れるのはいいですけど\\w5…\\w5…\\w5あんまり硬い物と一緒にしないでくださいね。\\w9\\w9\\uわいは入られへんのやけど、\\w5カバンの中てどないな感じなん？\\w9\\w9\\h\\n\\n身動き取れなくて\\w5…\\w5…\\w5苦しくて\\w5…\\w5…\\w9\\nそれがまた快か…\\w9\\u\\s[11]\\n\\n待てやそれ。\\e',
        //     '\\u\\s[10]\\0\\s[3]サイドバーって美味しそうですよね。\\w9\\w9\\1…\\w5…\\w5チキンバーとかとごっちゃになってへんか？\\w9\\w9\\0\\s[4]\\n\\nどーせ私には縁もゆかりもない代物ですけどね。\\w9ふんだ。\\w9\\w9\\1\\n\\n可愛いつもりかいな…\\w5…\\w5\\w9\\w9\\0\\s[1]\\n\\nスペックとか可愛いと思いませんか？\\w9\\w9\\1\\n\\n思わん。\\w9\\w9\\0\\s[26]\\n\\n…\\w5…\\w5いぢわる。\\e',
        //     '\\h\\s[0]\\u\\s[10]なぁ、\\w5ＣＰＵ遅いんやったら、\\w5もう一個積んだらどないや？\\w9\\w9\\h\\s[7]…\\w5…\\w5私を脱がせるのは、\\w5よほどの根性がいるって知らないの？\\w9\\w9\\u\\n\\n…\\w5…\\w5あ～、\\w5無駄にややっこしいことになっとるからなあ。',
        //     '\\u\\s[10]\\h\\s[6]えーと、\\w5１、\\w5２、\\w5３、\\w5４\\w5…\\w5…\\w9\\w9\\u何を数えとるねん。\\w9\\w9\\h\\s[3]\\n\\nいえ、\\w5この計算なんですけど\\w5…\\w5…\\w9\\w9\\u\\n\\n…\\w5…\\w5曲がりなりにもコンピューターちゃうかったんか？\\w9\\w9\\h\\s[5]\\n\\n２進数は、\\w5指で数えるとわかりやすいんですよ？\\w9\\u\\s[11]\\n\\nふつうに計算せぇや！\\e',
        //     '\\u\\s[10]\\h\\s[9]れっつのーとさんには負けません！\\w9\\w9\\u性能も機能も、\\w5おもっくそ負けとるやないか。\\w9\\w9\\h\\s[26]\\n\\nそんなことないよ～\\w5…\\w5…',
        //     '\\u\\s[10]\\h\\s[7]それなら、\\w5だ、\\w5W-ZERO3さんには！！\\w9\\w9\\uそれ、\\w5全然ジャンルちゃうで。\\w9\\w9\\h\\s[26]\\n\\nうわーん\\w5…\\w5…',
        //     '\\u\\s[10]\\h\\s[7]だいなぶっくさんには！！\\w9\\w9\\u…\\w5…\\w5だいなぶっくさんには？\\w9\\w9\\h\\s[26]\\n\\n勝てないかも知れない…\\w5…\\w5\\w9\\w9\\u\\n\\nそらそうやろな。',
        //     '\\u\\s[10]\\h\\s[5]ユーザさん、\\w5わたしをいろんなところに連れて行ってくださいね。\\w9\\nお仕事用のソフトでもゲームでも、\\w5電源の続く限りなんでも動かしてみせますから。\\w9\\w9\\u小型ノートパソコンの強みやね。\\w9\\n…\\w5…\\w5\\s[11]それだけ水没だの落下だの、\\w5ひどい目に遭う可能性も大きいわけやが。\\w9\\w9\\h\\s[3]\\n\\nいじわる言わないでくださいよぅ。',
        //     '\\u\\s[10]\\0\\s[0]私の取り扱いには、\\w5充分注意してくださいね。\\w9\\w9\\1まあ、\\w5腐っても精密機器やからなぁ。\\w9\\w9\\0\\s[3]\\n\\n電源切ってから５秒以内に電源入れたり、\\w5フリーズしたからって立て続けに強制終了したり、\\w5伝統芸能斜め４５度チョップしたり…\\w5…\\w5\\w9\\w9\\1\\n\\n…\\w5…\\w5それは取り扱い以前の問題や。\\e',
        //     '\\u\\s[10]\\h\\s[9]れっつのーとさんには負けません！\\w9\\w9\\u性能も機能も、\\w5おもっくそ負けとるやないか。\\w9\\w9\\h\\s[26]\\n\\nそんなことないよ～\\w5…\\w5…',
        //     '\\u\\s[10]\\h\\s[7]ばいおUさんにも負けませんっ！！\\w9\\w9\\u付属品の無さでは大勝利やね。\\w9\\w9\\h\\s[26]\\n\\n…\\w5…\\w5嬉しくない\\w5…\\w5…',
        //     '\\u\\s[10]\\0\\s[3]そういえば…\\w5…\\w5私の兄弟って、\\w5バッテリーどうしてるんだろ…\\w5…\\w5\\w9\\w9\\1もうほとんど居てへんのと違うか。\\w9\\w9\\0\\n\\nへたったバッテリーで、\\w5お腹空かせてないかなぁ…\\w5…\\w5\\w9\\w9\\1\\n\\nせやからほとんど居てへんと。\\w9\\w9\\0\\n\\n変なバッテリー繋げられて、\\w5お腹痛くしてないかなぁ…\\w5…\\w5\\w9\\w9\\1\\n\\n現実をもっと見つめぇや。\\e',
        //     '\\h\\s[0]\\1\\s[10]しかし、\\w5なんで眼鏡やねん。\\w9\\nどっかの開発者に毒されたんか。\\w9\\w9\\0\\s[3]これ、\\w5眼鏡じゃないですよ。\\w9液晶保護シートです。\\w9\\w9\\1\\n\\n…\\w5…\\w5はぁ？\\e',
        //     '\\u\\s[10]\\h\\s[3]わたし\\w5…\\w5…\\w5\\nよく、\\w9\\n「やたら遅い」\\w9\\n「中途半端」\\w9\\n「ちみっこい」\\w9\\nって言われるんですけど、\\w5どうしたらいいでしょう。\\w9\\w9\\uどうもこうもない。\\w9\\nとりあえず、\\w5アレな設計した人間を恨むんやね。\\w9\\w9\\h\\s[4]\\n\\nはぅ\\w5…\\w5…\\w5',
        //     '\\h\\s[0]\\u\\s[10]なぁ、\\w5ＣＰＵ遅いんやったら、\\w5もう一個積んだらどないや？\\w9\\w9\\h\\s[7]…\\w5…\\w5私を脱がせるのは、\\w5よほどの根性がいるって知らないの？\\w9\\w9\\u\\n\\n…\\w5…\\w5あ～、\\w5無駄にややっこしいことになっとるからなあ。'
        //   ]);
        // case 'OnMouseDoubleClick':
        //   switch ('' + req.Reference3 + req.Reference4 + 'つつかれ') {
        //     case '0Ribbonつつかれ':
        //       return '\\u\\s[10]\\h\\s[3]あ\\w5…\\w5…\\w5こんなところで\\w5…\\w5…\\w5…\\w9\\nリボン外すなんて\\w5…\\w5…\\w9\\w9\\u\\s[11]…\\w5…\\w5…\\w9\\w9\\h\\s[9]\\n\\nユーザさん大胆なんだからー！！\\w9\\w9\\s[-1]\\w9\\w9\\u\\n\\nあ\\w5…\\w5…\\w9\\n熱暴走して停止したみたいやな\\w5…\\w5…'
        //     case '0Headつつかれ':
        //       return '\\u\\s[10]\\h\\s[40]はう、\\w5頭がうね～っとしちゃいます～。\\w9\\w9\\u\\s[11]…\\w5…\\w5うね～って何や、\\w5うね～って。\\e';
        //     case '0Ponyつつかれ':
        //       return '\\h\\s[0]\\u\\s[13]ポニテ萌えやな？\\w9\\w9\\h\\s[4]なんですかそれ。';
        //     case '0Powerつつかれ':
        //       return '\\u\\s[10]\\h\\s[3]長押ししないでくださいね。\\w9\\n電源が切れちゃいます。\\w9\\w9\\uそやで。\\w5切れてまうで。\\w9\\n具体的には、\\w5\\s[11]なんじゃこらアホシバいたろかモツ抜いて南港にコンクリ詰めで沈めたるわ～！！！\\w9\\w9\\n…\\w5…\\w5\\s[10]と、\\w5こんな感じやね。\\w9\\w9\\h\\s[4]\\n\\nその切れるじゃありません\\w5…\\w5…'
        //     case '0Bustつつかれ':
        //       return '\\u\\s[10]\\h\\s[6]不正な処理が行われました。\\w9\\nユーザさんが強制終了されます。\\w9\\w9\\u\\s[11]そんなに嫌なんか\\w5…\\w5…';
        //     case '0Footつつかれ':
        //       return '\\u\\s[10]\\h\\s[9]やめてください。\\w9\\nフットパッドが外れるじゃないですか。\\w9\\w9\\uあれ外れるとガタつくからなあ。\\w9\\w9\\h\\n\\n素足になっちゃいますよ。\\w9\\w9\\u\\s[11]\\n\\nあー。\\w9\\n素足フェチならやるかもな。\\w9\\w9\\h\\s[26]\\n\\nそんなの嫌ー。'
        //     case '1Screenつつかれ':
        //       return this.choice([
        //         '\\u\\s[10]\\h\\s[0]タッチパネル形式だったっけ。\\w9\\w9\\u\\s[11]\\nちゃうわ、\\w5アホ。\\e',
        //         '\\u\\s[12]はうぁ！！\\w9\\w9\\h\\s[2]！！！！！\\w9\\w9\\n\\s[26]ユーザさん、\\w5壊しちゃだめです～！\\w9\\w9\\u\\s[11]\\n\\nでもすぐに直る素敵仕様や！！\\w9\\w9\\h\\s[4]\\n\\n…\\w5…\\w5なんですかそれ。',
        //       ]);
        //     default:
        //       return '\\u\\s[10]\\h\\s[5]はい、\\w5何でしょう？\\n\\n[half]\\_q\\![*]\\q[なにか話して(F12)　　,Choice_AITALK]\\_l[145]\\![*]\\q[コントロールパネル　 ,Choice_CONTROL_PANEL]\\n\\![*]\\q[便利機能　　　　　　 ,Choice_SWISSARMY]\\_l[145]\\![*]\\q[システム情報　　　　 ,Choice_SYSTEM_INFO]\\n\\![*]\\q[Gainer制御　　　　　 ,Choice_Gainer]\\_l[145]\\![*]\\q[デバッグ　　　　　　 ,Choice_DEBUG]\\n\\n[half]\\![*]\\q[メニューを閉じる　　　　　　　　　　　　　　　,Choice_CANCEL]\\_q';
        //   }
        // case 'OnChoiceSelect':
        //   switch (req.Reference0) {
        //     case 'Choice_AITALK':
        //       return this.shioriRequest({ID: 'OnTalk'});
        //     case 'Choice_CONTROL_PANEL':
        //       return '\\h\\s[0]その機能はオミットされました。';
        //     case 'Choice_SWISSARMY':
        //       return '\\h\\s[0]その機能はオミットされました。';
        //     case 'Choice_SYSTEM_INFO':
        //       return '\\h\\s[0]その機能はオミットされました。';
        //     case 'Choice_Gainer':
        //       return '\\h\\s[0]その機能はオミットされました。';
        //     case 'Choice_DEBUG':
        //       return '\\h\\s[0]その機能はオミットされました。';
        //     case 'Choice_CANCEL':
        //       return '\\h\\s[0]はい、\\w5わかりました。\\e'
        //   }
        // case 'OnMouseMove':
        //   switch ('' + req.Reference3 + req.Reference4 + 'なでられ') {
        //     case '0Headなでられ':
        //       return '\\u\\s[10]\\h\\s[1]…\\w5…\\w5あ\\w5…\\w5…\\w9\\nフタをなでても高速にはなりませんよ？\\w9\\w9\\uどこからどう見てもフタやなくて頭に見えるんやが。';
        //     case '0Bustなでられ':
        //       return '\\u\\s[10]\\h\\s[2]！！！\\w9\\w9\\uんー、\\w5まあ、\\w5そこをなでるんは勘弁したってな。\\w9\\w9\\h\\n\\nキーボードなんかなでるところじゃありませんよ！？\\w9\\w9\\u\\s[11]\\n\\n…\\w5…\\w5どう見てもチチや。\\w5あんたの。';
        //     case '0Footなでられ':
        //       return '\\h\\s[5]…\\w5…\\w5くすぐったいですよぉ。';
        //     case '1Screenなでられ':
        //       return '\\h\\s[0]\\u\\s[10]…\\w5…\\w5指紋でべたべたになってまうがな。\\w9\\w9\\h\\s[9]ちゃんと後で拭いておいてくださいね。';
        //   }
    }
    return '';
  }

}

# Compte rendu de l'audit des contrats GCW Presale, Sale et Token
#### _Fait en décembre 2019, par [Jonathan "Blocs" Serra](https://blocs.fr/)_

# Introduction

Ce document passe en revu les trois contrats suivants :
- [GCWToken](contracts/GCWToken.sol) : Jeton de Gocoworker ;
- [GCWPreSale](contracts/GCWPreSale.sol) : Presale du jeton GCW ;
- [GCWSale](contracts/GCWSale.sol) : Vente périodique de jetons sur cycles de 21 heures ;

Toutes les vulnérabilités potentielles et les bonnes pratiques de code sont relevées par 3 marqueurs présents dans le code source des contrats en commentaires et dans les tests en de rares occasions :
- `MAJOR_x` où x est un nombre à 2 chiffres : Ce sont les parties qui ont un impact sur la logique du code ;
- `MEDIUM_x` où x est un nombre à 2 chiffres : Ce sont les parties qui nécessitent une attention particulière ;
- `MINOR_x` où x est un nombre à 2 chiffres : Ce sont les parties qui peuvent être améliorées ;
- `WATCH_x` où x est un nombre à 2 chiffres : Ce sont tous les points où l'attention est demandée lorsque une curiosité est levée mais qu'il se peut que ce soit un choix de conception ;

Pendant l'audit des tests unitaires ont été écrits. Ils sont inclus dans le code source associé.

Tous les tests ont été exécutés dans l'environnement de développement avec Ganache en mode minage.

Certaines attaques on été testées avec `truffle console`.

Tous le code source à l'excepté de `Migrations.sol` et tous les contrats de OpenZeppelin Solidity sont été méticuleusement revus.

Dans ce document les parties critiques sont référencées par **CRITICAL**.

# Sommaire

1. [Note d'attention](#1)
2. [Vue d'ensemble](#2)
3. [Attaques réalisées](#3)
4. [Abus du contrat](#4)
5. [Majeur](#4)
6. [Medium](#5)
7. [Mineur](#6)
8. [Vigilance](#7)
9. [Conclusion](#8)

# 1. <a name="1"></a>Note d'attention

Cet audit ne concerne pas la viabilité du business autour des contrats concernés. Sont concernées la qualité de code des contrats ainsi que la sécurité. Cet audit est livré avec :
- Un document de compte rendu ;
- Le code source commenté pour les références ;
- Des mises à jour et ajout de tests unitaires ;

# 2. <a name="2"></a>Vue d'ensemble

Les contrats consistent en la vente de jetons ERC20, implémentés avec la librairie [OpenZeppelin Solidity](https://github.com/OpenZeppelin/openzeppelin-contracts). La vente se déroule en deux étapes et un jeton.

#### _Token_

Token ERC20 GOCO.

Constructeur:
- `teamWallet`: portefeuille du fondateur, il reçoit 7 000 000 GOCO;
- `tokenSaleWallet`: portefeuille de la vente et là prévente, il reçoit 12 600 000 GOCO;
- `rewardPoolWallet`: portefeuille de la récompense, il reçoit 1 400 000 GOCO;

Tous les jetons sont créés au déploiement avec un total de 21 000 000 GOCO qui constitu le **total supply**, `_mint` est interne.

#### _Presale_

Vente limitée en quantité et en temps de jetons GCW. Programme de parrainage pour associer un investisseur avec un filleul qui recevront tous deux une récompense de jetons lorsque l'investisseur achète des jetons.

Constructeur:
- `openingTime`: date de début de la prévente;
- `closingTime`: date de fin de la prévente;

La prévente nécessite d'avoir des fonds en jetons GOCO pour opérer.

#### _Sale_

Vente limitée en quantité et en temps de jetons GCW. La vente est quantifiée sur des intervales de temps de 21 heures renouvellé jusqu'à la fin de la vente.

Tous les jetons sont redistribués à des portefeuilles à la finalisation.

Constructeur:
- `openingTime`: date de début de la vente;
- `wallet`: portefeuille de la vente;
- `rewardpool`: portefeuille de récompense;
- `numberOfPeriod`: nombre de périodes de vente;
- `token`: contrat du jeton GOCO;

La vente nécessite d'avoir des jetons GOCO en réserve pour opérer.

# 3. <a name="3"></a>Attaques réalisées

Toutes les attaques passées en revue sont listées sur https://consensys.github.io/smart-contract-best-practices/known_attacks/

## Attaque par Short address

Citation de [vessenes.com](https://vessenes.com/the-erc20-short-address-attack-explained/):

>The server taking in user data allowed an Ethereum address that was less than 20 bytes: usually an Ethereum address looks like 0x1234567890123456789012345678901234567800.
What if you leave off those trailing two zeros (one hex byte equal to 0)? The Ethereum VM will supply it, but at the end of the packaged function arguments, and that's a very bad place to add extra zeros.

Dans le code il y a seulement sur `ERC20` que l'attaque est possible et intéressante pour un attaquant. Spécifiquement avec les fonctions `transfer`, `transferFrom` and `approve`.

L'attaque pas short address est limitée depuis [Solidity version 0.5.0](https://github.com/ethereum/solidity/pull/4224). Tout le code source _DOIT_ être à cette version. La version de `ERC20` dans OpenZeppelin est `^0.5.0`.

## Attaque Reentrancy

L'attaque Reentrancy est une attaque qui a causé le fameux TheDAO hack. L'exploitation de cette attaque consiste à tricher une erreur après un appel de fonction. Le contrat victime pense qu'une fonction de transfert de valeur échoue. Voilà un exemple :

```js
contract VictimContract {
  mapping (address => uint) private balances;

  transfer(address to, uint256 value) external return (bool) {
    // call fallback of AttackContract
    (bool success, ) = to.call.value(value)("");
    require(success);

    // never updated
    balances[msg.sender] = balances[msg.sender].sub(value);
  }
}

contract AttackContract {
  // fallback function for reentrant
  function () {
    // call transfer of VictimContract
    VictimContract.transfer(0x123456789abcdef123, 10);
    throw;
  }
}
```

Dans le contrat GOCO l'attaque Reentrancy est potentiellement exploitable dans `buyTokens`. `RetrancyGuard` est appliqué à cette fonction ce qui la protège contre l'attaque Reentrancy. Aucun appel inconnu n'est exécuté dans le contrat, ce qui limite d'autant plus les possibilités d'attaque Reentrancy.

**Cependant, soyez prudent au sujet du tag `MAJOR_03` qui est à propos de cette fonction.**

## Nombre Overflow

Tous les caluls sont réalisés avec SafeMath. Aucun overflow n'est possible.

## DoS avec revert

Denial of Service en préparant un revert infini.

C'est une attaque qui consiste à bloquer une fonction par revert infini, lorsque le contrat dépend d'une adresse utilisateur enregistrée dans les états.

Tous les `require` ne dépendent pas d'une adresse qui peut provoquer un revert infini.

Cette attaque n'est pas possible.

## DoS par bloc GAS Limit

Denial of Service en gonflant artificiellement le GAS Limit dans un lapse de temps, ce qui bloque les futures transactions vers le contrat.

Cette attaque est seulement possible avec les fonctions qui permettent un montant de GAS illimité.

`batchClaim` étant public et permettant théoriquement une infinité de paramètres peut être utilisée avec cette attaque.

**CRITICAL**: cette attaque peut empêcher le bon fonctionnement du contrat, donc stopper la vente.

## Attaque par GAS Insufisant

Uniquement possible quand le contrat utilise un proxy, ce n'est pas le cas ici.

## Forçage d'envoie d'ether à un contrat

Cette attaque n'aurait aucun effet sur ce contrat.

# 4. <a name="4"></a>Abus du contrat

## Programme d'affiliation en prévente

Il n'y a pas de contrôle sur qui affilie qui.

`addReferee` prend deux paramètres, l'affilié et le parrain. Il n'y a pas de contrôle sur qui appelle cette fonction. Un attaquant peut contrôler une liste d'investisseurs et s'affilier lui même à ces derniers, bénéficiant des futurs investissements.

**CRITICAL**: Cet abus est probable d'arriver et peut être évité en contrôlant qui ajoute un affilié.

# 5. <a name="5"></a>Majeur

|                      | Tag      | Contract       | Details       |
|----------------------|----------|:--------------:|---------------|
| :white_large_square: | MAJOR_01 | GCWPreSale.sol | Présent à deux reprises. La mise à jour de la date de cloture et de fermeture de la vente peut permettre de mettre une date d'ouverture supérieure à la date de fermeture. Cela peut impacter la logique du contrat en cas d'erreur humaine.              |
| :white_large_square: | MAJOR_02 | GCWPreSale.sol | Un filleul peut être ajouté quand bien même le programme de parrainage est désactivé. Il se peut que ce soit une volonté, voir `WATCH_02`              |
| :white_large_square: | MAJOR_03 | GCWSale.sol    | `buyTokens` doit profiter de l'héritage OpenZeppelin afin de profiter un maximum des contrats audités. L'ordre est à revoir. La mise à jour des états `dailyTotals` et `userBuys` doit être lancée à la fin de la fonction, en `_postValidatePurchase`.  |
| :white_large_square: | MAJOR_04 | GCWSale.sol    | Augmenter ou réduire le nombre de période doit également mettre à jour la distribution de jetons durant la vente. Cependant cette mise à jour entre en conflit avec les distributions antécédentes et entrer en conflit avec le cap de distribution. |

# 6. <a name="6"></a>Medium

|                      | Tag       | Contract(s)    | Details       |
|----------------------|-----------|:--------------:|---------------|
| :white_large_square: | MEDIUM_01 | GCWPreSale.sol | La fonction ne fait rien. |
| :white_large_square: | MEDIUM_02 | GCWPreSale.sol | `saleWallet` et `rewardPoolWallet` peuvent être identiques. |
| :white_large_square: | MEDIUM_03 (removed) | NA | NA |
| :white_large_square: | MEDIUM_04 | GCWPreSale.sol / GCWSale.sol | Doit respecter l'héritage |
| :white_large_square: | MEDIUM_05 | GCWPreSale.sol | Préférer l'usage d'un `require` plutôt qu'une condition pour reverser les gas. |
| :white_large_square: | MEDIUM_06 | GCWPreSale.sol | `require` manquant |
| :white_large_square: | MEDIUM_07 | GCWSale.sol    | Préférer l'usage d'un `require` plutôt qu'une condition pour reverser les gas. |
| :white_large_square: | MEDIUM_08 (déplacé) | GCWSale.sol    | Voir MAJOR_03 |
| :white_large_square: | MEDIUM_09 | GCWToken.sol   | `teamWallet`, `tokenSaleWallet` et `rewardPoolWallet` peuvent être identiques et 0. |
| :white_large_square: | MEDIUM_10 | GCWSale.sol    | `nonReentrant` modifier doit être une fonction `external`. Voir [source](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/ReentrancyGuard.sol) |

# 7. <a name="7"></a>Mineur

|                      | Tag      | Contrat(s)                                     | Commentaires  |
|----------------------|----------|:-------------------------------------------:|---------------|
| :white_large_square: | MINOR_01 | GCWPreSale.sol / GCWSale.sol / GCWToken.sol | Solidity pragma doit être une valeur fixe. Retirer le `^` et préférer une version à jour. |
| :white_large_square: | MINOR_02 (supprimé) | NA | NA |
| :white_large_square: | MINOR_03 | GCWPreSale.sol / GCWSale.sol | Inverser les conditions pour améliorer la lisibilité du code. |
| :white_large_square: | MINOR_04 | GCWPreSale.sol | Améliorer l'ordre des appels. |
| :white_large_square: | MINOR_05 | GCWPreSale.sol | Séparer le `require` en plusieurs `require`. |
| :white_large_square: | MINOR_06 | GCWPreSale.sol | Améliorer la condition. |
| :white_large_square: | MINOR_07 | GCWPreSale.sol | Ajouter un `require` pour éviter une consommation de GAS inutile. |
| :white_large_square: | MINOR_08 | GCWSale.sol | Ajout d'un `require` supplémentaire pour éviter les erreurs humaines. |
| :white_large_square: | MINOR_09 | GCWSale.sol | Fonction publique doit être précisément nommée et doit commencer par un verbe à l'infinitif (make, build, do, etc.). Convention de code "self documented" |
| :white_large_square: | MINOR_10 | GCWSale.sol | La variable devrait être constante pour améliorer la lisibilité du code. |
| :white_large_square: | MINOR_11 | GCWSale.sol | Eviter les instructions ternaires. |
| :white_large_square: | MINOR_12 | GCWSale.sol | Préférer l'appel à la fonction `token()`. |

# 8. <a name="8"></a>Vigilance

|                      | Tag      | Contrat(s)        | Commentaires  |
|----------------------|----------|:--------------:|---------------|
| :white_large_square: | WATCH_01 | GCWPreSale.sol | Le code ne profite pas de l'héritage OpenZeppelin sans que la raison semble justifiée. |
| :white_large_square: | WATCH_02 | GCWPreSale.sol / GCWSale.sol | Logique de parrainage contre-intuitive pour l'utilisateur. Lorsqu'un utilisateur a un filleul, l'activation du parrainage est garrante de la distribution de la récompense. Cela pourrait amener de la confusion de point de vue des investisseurs. |
| :white_large_square: | WATCH_03 | GCWSale.sol | La fonction existe déjà par héritage. |

# 9. <a name="9"></a>Conclusion

Le code respecte en partie l'intégration des contrats audités OpenZeppelin. L'utilisation de SafeMath est présente à tous les calculs. Bon respect de l'encapsulation.

Dans certaines parties l'héritage est sous exploité (voir les tags).

Les contrats OpenZeppelin sont audités par une communauté de professionnels. Dans cet audit ils n'ont pas été passés en revu.

Avant le déploiement du contrat le contrat _DOIT_ être déployé sur Ropsten avec des périodes limitées pour toutes les passer en revue, environnement pre-production. Le déploiement pre-production doit être fait de la même façon que le déploiement en production, avec les paramètres mis à jour.

Deux parties critiques ont été relevées. Le code _DOIT_ être mis à jour en conséquence.

**Le code doit être un peu plus commenté en particulier au niveau des fonctions publiques** pour une question d'ouverture du code et pour apporter plus de confiance au investisseurs connaisseurs.

_Dernière mise à jour le 02 décembre 2019_
